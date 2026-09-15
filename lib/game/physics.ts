// Axis-aligned solid boxes: the same box is a wall when it rises above the
// player's step height and a floor when its top is within reach. That one rule
// gives real walls, walkable floors, stairs and climbable furniture, and it is
// what stops the player from sinking through floors or walking through houses.

import * as THREE from "three";

export interface Solid {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
  owner: string;
}

export const STEP = 0.62; // tallest ledge you walk up without jumping

export class Physics {
  solids: Solid[] = [];

  add(owner: string, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number) {
    this.solids.push({ owner, minX, minY, minZ, maxX, maxY, maxZ });
  }

  // centre + full size, with an optional quarter-turn rotation about (px, pz)
  addBox(owner: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
    this.add(owner, cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2);
  }

  private tmpBox = new THREE.Box3();
  addObject(owner: string, obj: THREE.Object3D) {
    obj.updateWorldMatrix(true, true);
    this.tmpBox.setFromObject(obj);
    const b = this.tmpBox;
    this.add(owner, b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z);
  }

  removeOwner(owner: string) {
    this.solids = this.solids.filter((s) => s.owner !== owner);
  }

  // Highest floor under a footprint whose top is at most one step above the feet.
  groundAt(x: number, z: number, feetY: number, r: number) {
    let best = -Infinity;
    const rr = r * 0.55;
    for (const s of this.solids) {
      if (s.maxY > feetY + STEP || s.maxY <= best) continue;
      if (x + rr < s.minX || x - rr > s.maxX || z + rr < s.minZ || z - rr > s.maxZ) continue;
      best = s.maxY;
    }
    return best;
  }

  // Lowest ceiling above the head, so jumps stop under roofs instead of clipping.
  ceilingAt(x: number, z: number, headY: number, r: number) {
    let best = Infinity;
    const rr = r * 0.5;
    for (const s of this.solids) {
      if (s.minY < headY - 0.3 || s.minY >= best) continue;
      if (x + rr < s.minX || x - rr > s.maxX || z + rr < s.minZ || z - rr > s.maxZ) continue;
      best = s.minY;
    }
    return best;
  }

  // Push a standing cylinder (feet at pos.y) out of every wall it overlaps.
  collide(pos: THREE.Vector3, r: number, h: number) {
    let hit = false;
    for (let pass = 0; pass < 3; pass++) {
      let moved = false;
      for (const s of this.solids) {
        if (s.maxY <= pos.y + STEP || s.minY >= pos.y + h) continue;
        const cx = Math.max(s.minX, Math.min(pos.x, s.maxX));
        const cz = Math.max(s.minZ, Math.min(pos.z, s.maxZ));
        const dx = pos.x - cx;
        const dz = pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-10) {
          const d = Math.sqrt(d2);
          pos.x = cx + (dx / d) * r;
          pos.z = cz + (dz / d) * r;
        } else {
          // centre ended up inside the box: leave through the nearest face
          const l = pos.x - s.minX, rt = s.maxX - pos.x;
          const b = pos.z - s.minZ, f = s.maxZ - pos.z;
          const m = Math.min(l, rt, b, f);
          if (m === l) pos.x = s.minX - r;
          else if (m === rt) pos.x = s.maxX + r;
          else if (m === b) pos.z = s.minZ - r;
          else pos.z = s.maxZ + r;
        }
        moved = hit = true;
      }
      if (!moved) break;
    }
    return hit;
  }

  inside(x: number, y: number, z: number, pad = 0) {
    for (const s of this.solids) {
      if (
        x > s.minX - pad && x < s.maxX + pad &&
        y > s.minY - pad && y < s.maxY + pad &&
        z > s.minZ - pad && z < s.maxZ + pad
      )
        return true;
    }
    return false;
  }

  // Shorten a camera boom so the lens never ends up inside a wall.
  clampBoom(from: THREE.Vector3, to: THREE.Vector3, out: THREE.Vector3) {
    const steps = 14;
    out.copy(to);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + (to.x - from.x) * t;
      const y = from.y + (to.y - from.y) * t;
      const z = from.z + (to.z - from.z) * t;
      if (this.inside(x, y, z, 0.25)) {
        const k = Math.max(0.08, (i - 1.3) / steps);
        out.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k, from.z + (to.z - from.z) * k);
        return true;
      }
    }
    return false;
  }
}
