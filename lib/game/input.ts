// One input layer for keyboard + mouse, standard gamepads (Xbox / PlayStation
// on Windows, Android Chrome) and the on-screen touch controller.
//
// Axis conventions, fixed once here so nothing downstream can invert them:
//   moveX  +1 = strafe right          moveY  +1 = walk forward (away from camera)
//   lookX  +  = turn right (radians)  lookY  +  = look up (radians)
// Gamepad sticks report up as -1 on the Y axis (W3C standard mapping), so the
// Y axes are negated here. "Invert look" is an opt-in setting, never the default.

export interface InputFrame {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean; // held
  sprint: boolean; // held
  interact: boolean; // edge
  attack: boolean; // edge
  toggleView: boolean; // edge
  useItem: boolean; // edge
  menu: boolean; // edge
  device: "keyboard" | "gamepad" | "touch";
}

export interface TouchState {
  moveX: number;
  moveY: number;
  lookDX: number; // pixels accumulated since last read
  lookDY: number;
  jump: boolean;
  sprint: boolean;
  interact: boolean;
  attack: boolean;
  toggleView: boolean;
  useItem: boolean;
}

export interface InputSettings {
  sensitivity: number; // 0.2 .. 3
  invertY: boolean;
}

const DEADZONE = 0.18;
function deadzone(x: number, y: number): [number, number] {
  const m = Math.hypot(x, y);
  if (m < DEADZONE) return [0, 0];
  const k = Math.min(1, (m - DEADZONE) / (1 - DEADZONE)) / m;
  return [x * k, y * k];
}

export class Input {
  keys: Record<string, boolean> = {};
  private edges = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private padPrev: boolean[] = [];
  lastDevice: InputFrame["device"] = "keyboard";
  gamepadName = "";
  settings: InputSettings = { sensitivity: 1, invertY: false };
  touch: TouchState = {
    moveX: 0, moveY: 0, lookDX: 0, lookDY: 0,
    jump: false, sprint: false, interact: false, attack: false, toggleView: false, useItem: false,
  };
  private el: HTMLElement | null = null;

  // Called by the on-screen controller (React components must not mutate
  // objects they receive, so every change goes through a method).
  setStick(x: number, y: number) {
    this.touch.moveX = x;
    this.touch.moveY = y;
  }
  addLook(dx: number, dy: number) {
    this.touch.lookDX += dx;
    this.touch.lookDY += dy;
  }
  press(key: "jump" | "sprint" | "interact" | "attack" | "toggleView" | "useItem", on = true) {
    this.touch[key] = on;
  }
  resetTouch() {
    this.setStick(0, 0);
    this.press("jump", false);
    this.press("sprint", false);
  }

  private isTyping(e: Event) {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
  }

  private kd = (e: KeyboardEvent) => {
    if (this.isTyping(e)) return;
    const k = e.key.toLowerCase();
    if (!this.keys[k]) this.edges.add(k);
    this.keys[k] = true;
    this.lastDevice = "keyboard";
    if (k === " " || k.startsWith("arrow")) e.preventDefault();
  };
  private ku = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };
  private blur = () => {
    this.keys = {};
  };
  private mm = (e: MouseEvent) => {
    if (document.pointerLockElement === this.el) {
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    } else if (this.dragging) {
      this.mouseDX += e.clientX - this.lastX;
      this.mouseDY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  };
  private md = (e: MouseEvent) => {
    if (e.button === 2 || e.button === 0) {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.lastDevice = "keyboard";
    }
  };
  private mu = () => {
    this.dragging = false;
  };
  private ctx = (e: MouseEvent) => e.preventDefault();

  attach(el: HTMLElement) {
    this.el = el;
    window.addEventListener("keydown", this.kd);
    window.addEventListener("keyup", this.ku);
    window.addEventListener("blur", this.blur);
    window.addEventListener("mousemove", this.mm);
    window.addEventListener("mouseup", this.mu);
    el.addEventListener("mousedown", this.md);
    el.addEventListener("contextmenu", this.ctx);
  }

  detach() {
    window.removeEventListener("keydown", this.kd);
    window.removeEventListener("keyup", this.ku);
    window.removeEventListener("blur", this.blur);
    window.removeEventListener("mousemove", this.mm);
    window.removeEventListener("mouseup", this.mu);
    this.el?.removeEventListener("mousedown", this.md);
    this.el?.removeEventListener("contextmenu", this.ctx);
    if (document.pointerLockElement) document.exitPointerLock();
    this.el = null;
  }

  requestPointerLock() {
    try {
      const p = this.el?.requestPointerLock() as unknown;
      if (p && typeof (p as Promise<void>).catch === "function") (p as Promise<void>).catch(() => {});
    } catch {}
  }

  read(dt: number): InputFrame {
    const k = this.keys;
    const sens = this.settings.sensitivity;
    let moveX = 0, moveY = 0, lookX = 0, lookY = 0;
    let jump = !!k[" "];
    let sprint = !!k["shift"];
    const edge = (key: string) => this.edges.has(key);
    let interact = edge("e") || edge("enter");
    let attack = edge("f");
    let toggleView = edge("v");
    let useItem = edge("q");
    let menu = edge("escape") || edge("tab");
    this.edges.clear();

    if (k["w"] || k["arrowup"]) moveY += 1;
    if (k["s"] || k["arrowdown"]) moveY -= 1;
    if (k["d"] || k["arrowright"]) moveX += 1;
    if (k["a"] || k["arrowleft"]) moveX -= 1;
    // keyboard look (for players without a mouse): J/L turn, I/K tilt
    if (k["l"]) lookX += 2.2 * dt * sens;
    if (k["j"]) lookX -= 2.2 * dt * sens;
    if (k["i"]) lookY += 1.6 * dt * sens;
    if (k["k"]) lookY -= 1.6 * dt * sens;

    // mouse: moving right turns right, moving up looks up
    lookX += this.mouseDX * 0.0032 * sens;
    lookY += -this.mouseDY * 0.0026 * sens;
    this.mouseDX = 0;
    this.mouseDY = 0;

    // gamepad (first connected, standard mapping)
    const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = Array.from(pads || []).find((p) => p && p.connected) || null;
    if (pad) {
      this.gamepadName = pad.id;
      const [lx, ly] = deadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      const [rx, ry] = deadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0);
      const b = pad.buttons.map((x) => x.pressed);
      const pe = (i: number) => !!b[i] && !this.padPrev[i];
      const any = lx || ly || rx || ry || b.some(Boolean);
      if (any) this.lastDevice = "gamepad";
      moveX += lx;
      moveY += -ly; // stick up (-1) = forward
      lookX += rx * 2.6 * dt * sens;
      lookY += -ry * 1.9 * dt * sens; // stick up = look up
      jump = jump || !!b[0]; // A / Cross
      sprint = sprint || !!b[1] || !!b[10] || (pad.buttons[7]?.value ?? 0) > 0.4; // B / L3 / RT
      attack = attack || pe(2); // X / Square
      interact = interact || pe(3); // Y / Triangle
      useItem = useItem || pe(4); // LB
      toggleView = toggleView || pe(11) || pe(5); // R3 / RB
      menu = menu || pe(9); // Start
      if (b[12]) lookY += 1.2 * dt; // d-pad tilt
      if (b[13]) lookY -= 1.2 * dt;
      this.padPrev = b;
    }

    // touch controller
    const t = this.touch;
    if (t.moveX || t.moveY || t.lookDX || t.lookDY || t.jump || t.sprint) this.lastDevice = "touch";
    moveX += t.moveX;
    moveY += t.moveY;
    lookX += t.lookDX * 0.006 * sens;
    lookY += -t.lookDY * 0.005 * sens;
    t.lookDX = 0;
    t.lookDY = 0;
    jump = jump || t.jump;
    sprint = sprint || t.sprint;
    if (t.interact) { interact = true; t.interact = false; }
    if (t.attack) { attack = true; t.attack = false; }
    if (t.toggleView) { toggleView = true; t.toggleView = false; }
    if (t.useItem) { useItem = true; t.useItem = false; }

    if (this.settings.invertY) lookY = -lookY;
    const m = Math.hypot(moveX, moveY);
    if (m > 1) {
      moveX /= m;
      moveY /= m;
    }
    return { moveX, moveY, lookX, lookY, jump, sprint, interact, attack, toggleView, useItem, menu, device: this.lastDevice };
  }
}
