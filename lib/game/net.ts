// Real-time play together over WebRTC data channels (PeerJS). One player hosts
// a private room; friends join with a 6-character code. The host relays a
// snapshot of everyone 15 times a second. Only avatar state and fixed emotes
// travel — there is no free-text chat, so strangers cannot message a child.

import type { DataConnection, Peer as PeerType } from "peerjs";
import type { Equip } from "./avatar";
import type { HeroId } from "@/lib/progression";

export const EMOTES = ["hello", "yay", "follow", "thanks", "look"] as const;
export type EmoteId = (typeof EMOTES)[number];
export const MAX_PLAYERS = 12;

export interface NetPlayer {
  id: string;
  name: string;
  hero: HeroId;
  equip: Equip;
  x: number;
  y: number;
  z: number;
  ry: number;
  speed: number; // 0..1, drives the walk cycle on other screens
  zone: string; // "world" | "cave" | "hall" | "arena"
  emote: EmoteId | null;
  emoteAt: number;
}

type Msg =
  | { t: "hello"; p: NetPlayer }
  | { t: "s"; p: NetPlayer }
  | { t: "w"; players: NetPlayer[] }
  | { t: "welcome"; id: string }
  | { t: "full" }
  | { t: "ping"; ts: number }
  | { t: "pong"; ts: number }
  | { t: "emote"; id: string; e: EmoteId };

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function makeCode() {
  let s = "";
  const r = new Uint32Array(6);
  crypto.getRandomValues(r);
  for (let i = 0; i < 6; i++) s += ALPHABET[r[i] % ALPHABET.length];
  return s;
}
export function cleanCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
export function cleanName(raw: string) {
  return raw.replace(/[^\p{L}\p{N}_ -]/gu, "").slice(0, 16) || "Explorer";
}
const peerId = (code: string) => `meadowfar-v1-${code}`;

export type RoomStatus = "connecting" | "open" | "error" | "closed";

export class Room {
  code = "";
  isHost = false;
  selfId = "";
  status: RoomStatus = "connecting";
  error = "";
  ping = 0; // round-trip ms, averaged
  players = new Map<string, NetPlayer>(); // everyone except me
  onChange: (() => void) | null = null;
  onEmote: ((id: string, e: EmoteId) => void) | null = null;
  private peer: PeerType | null = null;
  private conns = new Map<string, DataConnection>();
  private hostConn: DataConnection | null = null;
  private me: NetPlayer;
  private timers: ReturnType<typeof setInterval>[] = [];
  private pings: number[] = [];

  constructor(me: NetPlayer) {
    this.me = me;
  }

  private changed() {
    this.onChange?.();
  }

  private addPing(ms: number) {
    this.pings.push(ms);
    if (this.pings.length > 8) this.pings.shift();
    this.ping = this.pings.reduce((a, b) => a + b, 0) / this.pings.length;
  }

  static async host(me: NetPlayer): Promise<Room> {
    const room = new Room(me);
    room.isHost = true;
    const { Peer } = await import("peerjs");
    for (let attempt = 0; attempt < 4; attempt++) {
      const code = makeCode();
      try {
        await new Promise<void>((resolve, reject) => {
          const peer = new Peer(peerId(code), { debug: 0 });
          const fail = (e: unknown) => {
            peer.destroy();
            reject(e);
          };
          peer.once("open", () => {
            peer.off("error", fail);
            room.peer = peer;
            room.code = code;
            resolve();
          });
          peer.once("error", fail);
        });
        break;
      } catch (e) {
        if (attempt === 3) {
          room.status = "error";
          room.error = String((e as { type?: string })?.type ?? e);
          throw e;
        }
      }
    }
    room.selfId = "host";
    room.me.id = "host";
    room.status = "open";
    room.peer!.on("connection", (c) => room.acceptClient(c));
    room.peer!.on("disconnected", () => room.peer?.reconnect());
    // relay a snapshot of the room to every friend 15x per second
    room.timers.push(
      setInterval(() => {
        const all = [room.me, ...room.players.values()];
        room.conns.forEach((c, id) => {
          if (c.open) c.send({ t: "w", players: all.filter((p) => p.id !== id) } satisfies Msg);
        });
      }, 66),
      setInterval(() => {
        room.conns.forEach((c) => c.open && c.send({ t: "ping", ts: performance.now() } satisfies Msg));
      }, 1000)
    );
    return room;
  }

  private acceptClient(c: DataConnection) {
    c.on("open", () => {
      if (this.conns.size >= MAX_PLAYERS - 1) {
        c.send({ t: "full" } satisfies Msg);
        setTimeout(() => c.close(), 200);
        return;
      }
      this.conns.set(c.peer, c);
      c.send({ t: "welcome", id: c.peer } satisfies Msg);
    });
    c.on("data", (raw) => {
      const m = raw as Msg;
      if (m.t === "hello" || m.t === "s") {
        const p = { ...m.p, id: c.peer, name: cleanName(m.p.name) };
        const isNew = !this.players.has(c.peer);
        this.players.set(c.peer, p);
        if (isNew) this.changed();
      } else if (m.t === "ping") c.send({ t: "pong", ts: m.ts } satisfies Msg);
      else if (m.t === "pong") this.addPing(performance.now() - m.ts);
      else if (m.t === "emote") {
        this.onEmote?.(c.peer, m.e);
        this.conns.forEach((o, id) => id !== c.peer && o.open && o.send({ t: "emote", id: c.peer, e: m.e } satisfies Msg));
      }
    });
    const drop = () => {
      this.conns.delete(c.peer);
      this.players.delete(c.peer);
      this.changed();
    };
    c.on("close", drop);
    c.on("error", drop);
  }

  static async join(code: string, me: NetPlayer): Promise<Room> {
    const room = new Room(me);
    room.code = cleanCode(code);
    const { Peer } = await import("peerjs");
    await new Promise<void>((resolve, reject) => {
      const peer = new Peer({ debug: 0 });
      room.peer = peer;
      const timeout = setTimeout(() => reject(new Error("timeout")), 15000);
      peer.once("error", (e) => {
        clearTimeout(timeout);
        reject(e);
      });
      peer.once("open", (id) => {
        room.selfId = id;
        room.me.id = id;
        const c = peer.connect(peerId(room.code), { reliable: false, serialization: "json" });
        room.hostConn = c;
        c.on("open", () => {
          clearTimeout(timeout);
          room.status = "open";
          c.send({ t: "hello", p: room.me } satisfies Msg);
          resolve();
        });
        c.on("data", (raw) => room.fromHost(raw as Msg));
        c.on("close", () => {
          room.status = "closed";
          room.players.clear();
          room.changed();
        });
      });
    }).catch((e) => {
      room.status = "error";
      room.error = String((e as { type?: string })?.type ?? e);
      room.peer?.destroy();
      throw e;
    });
    room.timers.push(
      setInterval(() => {
        const c = room.hostConn;
        if (c?.open) c.send({ t: "ping", ts: performance.now() } satisfies Msg);
      }, 1000)
    );
    return room;
  }

  private fromHost(m: Msg) {
    if (m.t === "w") {
      const seen = new Set<string>();
      let changed = false;
      for (const p of m.players) {
        seen.add(p.id);
        if (!this.players.has(p.id)) changed = true;
        this.players.set(p.id, { ...p, name: cleanName(p.name) });
      }
      for (const id of [...this.players.keys()]) {
        if (!seen.has(id)) {
          this.players.delete(id);
          changed = true;
        }
      }
      if (changed) this.changed();
    } else if (m.t === "ping") this.hostConn?.send({ t: "pong", ts: m.ts } satisfies Msg);
    else if (m.t === "pong") this.addPing(performance.now() - m.ts);
    else if (m.t === "emote") this.onEmote?.(m.id, m.e);
    else if (m.t === "full") {
      this.status = "error";
      this.error = "full";
      this.changed();
    }
  }

  // called by the game loop at ~15 Hz with my latest state
  sendState(p: Omit<NetPlayer, "id">) {
    Object.assign(this.me, p);
    if (!this.isHost && this.hostConn?.open) this.hostConn.send({ t: "s", p: this.me } satisfies Msg);
  }

  emote(e: EmoteId) {
    this.me.emote = e;
    this.me.emoteAt = Date.now();
    if (this.isHost) this.conns.forEach((c) => c.open && c.send({ t: "emote", id: "host", e } satisfies Msg));
    else this.hostConn?.send({ t: "emote", id: this.selfId, e } satisfies Msg);
  }

  size() {
    return this.players.size + 1;
  }

  close() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.conns.forEach((c) => c.close());
    this.hostConn?.close();
    this.peer?.destroy();
    this.status = "closed";
    this.players.clear();
  }
}
