// Adventure-mode critters: squishy slimes that bump you, and the bubble wand
// that pops them into sparkles. Nothing bleeds, nothing dies — slimes "pop".

import * as THREE from "three";

interface Slime {
  g: THREE.Group;
  body: THREE.Mesh;
  vy: number;
  hop: number;
  heading: number;
  alive: boolean;
}

interface Bubble {
  m: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
}

const SLIME_COLORS = [0x6ee07a, 0xff8fd8, 0x6bd0ff, 0xffc94a];

export class Critters {
  slimes: Slime[] = [];
  bubbles: Bubble[] = [];
  private scene: THREE.Scene;
  private bubbleGeo = new THREE.SphereGeometry(0.32, 16, 12);
  private bubbleMat = new THREE.MeshStandardMaterial({
    color: 0xcff6ff, emissive: 0x88d8ff, emissiveIntensity: 0.5,
    transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2,
  });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setScene(scene: THREE.Scene) {
    this.clear();
    this.scene = scene;
  }

  spawn(x: number, y: number, z: number) {
    const c = SLIME_COLORS[this.slimes.length % SLIME_COLORS.length];
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 18, 14),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, transparent: true, opacity: 0.88, emissive: c, emissiveIntensity: 0.15 })
    );
    body.position.y = 0.6;
    body.castShadow = true;
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x1d1d2b });
    const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), eyeM);
    e1.position.set(-0.22, 0.78, 0.58);
    const e2 = e1.clone();
    e2.position.x = 0.22;
    g.add(body, e1, e2);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.slimes.push({ g, body, vy: 0, hop: Math.random() * 1.2, heading: Math.random() * 6.28, alive: true });
  }

  shoot(x: number, y: number, z: number, dirX: number, dirZ: number) {
    const m = new THREE.Mesh(this.bubbleGeo, this.bubbleMat);
    m.position.set(x, y, z);
    this.scene.add(m);
    const l = Math.hypot(dirX, dirZ) || 1;
    this.bubbles.push({ m, vx: (dirX / l) * 16, vz: (dirZ / l) * 16, life: 1.1 });
  }

  update(
    dt: number,
    now: number,
    player: THREE.Vector3,
    groundAt: (x: number, z: number) => number,
    onTouch: (dx: number, dz: number) => void,
    onPop: (p: THREE.Vector3, color: number) => void,
    chase: boolean
  ) {
    for (const s of this.slimes) {
      if (!s.alive) continue;
      const dx = player.x - s.g.position.x;
      const dz = player.z - s.g.position.z;
      const d = Math.hypot(dx, dz);
      const gy = groundAt(s.g.position.x, s.g.position.z);
      s.hop -= dt;
      const onGround = s.g.position.y <= gy + 0.01;
      if (onGround && s.hop <= 0) {
        s.vy = 4.2;
        s.hop = 0.9 + Math.random() * 0.6;
        s.heading = chase && d < 15 ? Math.atan2(dx, dz) : s.heading + (Math.random() - 0.5) * 1.6;
      }
      if (!onGround || s.vy > 0) {
        const sp = chase && d < 15 ? 3.4 : 1.6;
        s.g.position.x += Math.sin(s.heading) * sp * dt;
        s.g.position.z += Math.cos(s.heading) * sp * dt;
      }
      s.vy -= 14 * dt;
      s.g.position.y = Math.max(gy, s.g.position.y + s.vy * dt);
      if (s.g.position.y <= gy) s.vy = 0;
      s.g.rotation.y = s.heading;
      const squash = onGround ? 1 - Math.max(0, Math.sin(now / 120)) * 0.12 : 1.12;
      s.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
      if (d < 1.25 && Math.abs(player.y - s.g.position.y) < 1.6) onTouch(dx / (d || 1), dz / (d || 1));
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      b.m.position.x += b.vx * dt;
      b.m.position.z += b.vz * dt;
      b.m.position.y += Math.sin(now / 90 + i) * 0.01;
      const s = 1 + (1.1 - b.life) * 0.4;
      b.m.scale.setScalar(s);
      let popped = false;
      for (const sl of this.slimes) {
        if (!sl.alive) continue;
        if (b.m.position.distanceTo(sl.g.position.clone().setY(sl.g.position.y + 0.6)) < 1.3) {
          sl.alive = false;
          this.scene.remove(sl.g);
          const col = ((sl.body.material as THREE.MeshStandardMaterial).color).getHex();
          onPop(sl.g.position.clone().setY(sl.g.position.y + 0.6), col);
          popped = true;
          break;
        }
      }
      if (popped || b.life <= 0) {
        this.scene.remove(b.m);
        this.bubbles.splice(i, 1);
      }
    }
    this.slimes = this.slimes.filter((s) => s.alive);
  }

  count() {
    return this.slimes.length;
  }

  // keep the world tidy: slimes that wandered far away quietly leave
  cull(player: THREE.Vector3, maxDist: number) {
    for (const s of this.slimes) {
      if (s.g.position.distanceTo(player) > maxDist) {
        s.alive = false;
        this.scene.remove(s.g);
      }
    }
    this.slimes = this.slimes.filter((s) => s.alive);
  }

  clear() {
    this.slimes.forEach((s) => this.scene.remove(s.g));
    this.bubbles.forEach((b) => this.scene.remove(b.m));
    this.slimes = [];
    this.bubbles = [];
  }
}
