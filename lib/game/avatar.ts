// Character builder shared by the local player, friends in a room and the
// wardrobe preview. Everything is generated geometry — zero external assets.

import * as THREE from "three";
import type { HeroDef, HeroId } from "@/lib/progression";
import { cosmetic, DEFAULT_EQUIP, type Slot } from "@/lib/catalog";

export type Equip = Record<Slot, string>;

export interface Avatar {
  root: THREE.Group; // world position + heading
  body: THREE.Group; // lean + squash/stretch
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  setEquip(e: Equip): void;
  // flutter cape / wings; speed is 0..1 of a full run
  tick(now: number, speed: number): void;
  setHeadVisible(v: boolean): void;
  dispose(): void;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: number, glow = false, rough = 0.62, metal = 0) {
  const key = `${color}-${glow}-${rough}-${metal}`;
  let m = matCache.get(key);
  if (!m) {
    // physical material: soft fabrics and skin get a sheen lobe (the velvety
    // edge highlight real cloth has); metals and glossy parts get clearcoat
    const fabric = !glow && metal === 0 && rough >= 0.55;
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: rough,
      metalness: metal,
      emissive: glow ? color : 0x000000,
      emissiveIntensity: glow ? 0.55 : 0,
      sheen: fabric ? 0.7 : 0,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.45),
      clearcoat: metal > 0 || rough < 0.4 ? 0.5 : 0,
      clearcoatRoughness: 0.25,
    });
    matCache.set(key, m);
  }
  return m;
}

function shade(color: number, k: number) {
  const c = new THREE.Color(color);
  c.multiplyScalar(k);
  return c.getHex();
}

function mesh(geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  return o;
}

export function buildAvatar(hero: HeroDef, equip: Equip = DEFAULT_EQUIP): Avatar {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = mat(hero.skin, false, 0.7);
  const hair = mat(hero.hair, false, 0.8);

  // torso (outfit material swapped by setEquip)
  const torsoGeo = new THREE.CapsuleGeometry(0.42, 0.5, 6, 14);
  const torso = mesh(torsoGeo, mat(hero.cloth), 0, 1.55, 0);
  torso.scale.set(1, 1, 0.72);
  const belt = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.1, 16), mat(0x5a4636), 0, 1.2, 0);
  belt.scale.z = 0.74;
  const skirt = mesh(new THREE.CylinderGeometry(0.42, 0.62, 0.5, 14), mat(hero.cloth), 0, 1.0, 0);
  skirt.visible = hero.id === "girl";
  body.add(torso, belt, skirt);

  // head: rounded, with hair cap, eyes that catch the light, rosy cheeks
  const head = new THREE.Group();
  // closer to real body proportions: the head is about a sixth of the height
  head.position.set(0, 2.36, 0);
  head.scale.setScalar(0.8);
  const skull = mesh(new THREE.SphereGeometry(0.42, 20, 16), skin);
  const hairCap = mesh(
    new THREE.SphereGeometry(0.45, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hair, 0, 0.04, -0.02
  );
  const eyeGeo = new THREE.SphereGeometry(0.06, 10, 8);
  const eyeM = mat(0x1d1d2b, false, 0.3);
  const shineM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeL = mesh(eyeGeo, eyeM, -0.15, 0.02, 0.37);
  const eyeR = mesh(eyeGeo, eyeM, 0.15, 0.02, 0.37);
  const shineGeo = new THREE.SphereGeometry(0.02, 6, 6);
  eyeL.add(new THREE.Mesh(shineGeo, shineM).translateX(0.02).translateY(0.025).translateZ(0.045));
  eyeR.add(new THREE.Mesh(shineGeo, shineM).translateX(0.02).translateY(0.025).translateZ(0.045));
  const cheekM = new THREE.MeshStandardMaterial({ color: 0xff8f9a, transparent: true, opacity: 0.55 });
  const cheekGeo = new THREE.CircleGeometry(0.06, 12);
  const cheekL = new THREE.Mesh(cheekGeo, cheekM);
  cheekL.position.set(-0.24, -0.08, 0.34);
  cheekL.rotation.y = -0.5;
  const cheekR = new THREE.Mesh(cheekGeo, cheekM);
  cheekR.position.set(0.24, -0.08, 0.34);
  cheekR.rotation.y = 0.5;
  const smile = mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), mat(0x7a3a3a), 0, -0.12, 0.39);
  smile.rotation.z = Math.PI;
  head.add(skull, hairCap, eyeL, eyeR, cheekL, cheekR, smile);
  // facial structure: sclera behind the iris, brows, nose, ears, jaw
  const scleraGeo = new THREE.SphereGeometry(0.085, 12, 10);
  const scleraM = mat(0xfbfbf7, false, 0.35);
  const scL = mesh(scleraGeo, scleraM, -0.15, 0.02, 0.33);
  const scR = mesh(scleraGeo, scleraM, 0.15, 0.02, 0.33);
  scL.scale.set(1, 0.85, 0.6);
  scR.scale.set(1, 0.85, 0.6);
  // brows sit clear of the eyes so they never merge into one dark band
  const browGeo = new THREE.CapsuleGeometry(0.016, 0.1, 2, 6);
  const browL = mesh(browGeo, hair, -0.15, 0.21, 0.36);
  const browR = mesh(browGeo, hair, 0.15, 0.21, 0.36);
  browL.rotation.z = Math.PI / 2 - 0.12;
  browR.rotation.z = Math.PI / 2 + 0.12;
  const nose = mesh(new THREE.SphereGeometry(0.055, 10, 8), mat(shade(hero.skin, 0.93), false, 0.7), 0, -0.04, 0.41);
  nose.scale.set(0.9, 1.1, 0.9);
  const earGeo = new THREE.SphereGeometry(0.09, 10, 8);
  const earL = mesh(earGeo, skin, -0.41, -0.01, 0);
  const earR = mesh(earGeo, skin, 0.41, -0.01, 0);
  earL.scale.set(0.45, 1, 0.75);
  earR.scale.set(0.45, 1, 0.75);
  const jaw = mesh(new THREE.SphereGeometry(0.34, 16, 10), skin, 0, -0.14, 0.05);
  jaw.scale.set(1, 0.72, 0.95);
  // fringe: a row of rounded locks across the forehead
  const lockGeo = new THREE.CapsuleGeometry(0.06, 0.12, 3, 6);
  for (let i = 0; i < 6; i++) {
    const a = -0.55 + i * 0.22;
    const lock = mesh(lockGeo, hair, Math.sin(a) * 0.38, 0.26, Math.cos(a) * 0.36);
    lock.rotation.set(0.5, 0, -a * 0.6);
    head.add(lock);
  }
  head.add(scL, scR, browL, browR, nose, earL, earR, jaw);
  const neck = mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.3, 12), skin, 0, 2.08, 0);
  body.add(neck);
  body.userData.neck = neck;
  if (hero.id === "girl") {
    const longHair = mesh(new THREE.CapsuleGeometry(0.36, 0.5, 4, 12), hair, 0, -0.3, -0.2);
    longHair.scale.z = 0.5;
    head.add(longHair);
  }
  body.add(head);

  // limbs pivot at shoulder / hip so they swing from the joint
  const limb = (x: number, y: number, len: number, r: number, m: THREE.Material) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const seg = mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m, 0, -len / 2 - r * 0.4, 0);
    pivot.add(seg);
    pivot.userData.seg = seg;
    body.add(pivot);
    return pivot;
  };
  const armL = limb(-0.58, 1.95, 0.62, 0.13, mat(hero.cloth));
  const armR = limb(0.58, 1.95, 0.62, 0.13, mat(hero.cloth));
  // hands: palm, four fingers and a thumb instead of a ball
  const palmGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
  const fingerGeo = new THREE.CapsuleGeometry(0.028, 0.09, 2, 6);
  const buildHand = (side: number) => {
    const hand = new THREE.Group();
    hand.position.set(0, -0.86, 0);
    const palm = mesh(palmGeo, skin);
    palm.geometry.translate(0, 0, 0);
    hand.add(palm);
    for (let i = 0; i < 4; i++) hand.add(mesh(fingerGeo, skin, -0.075 + i * 0.05, -0.15, 0));
    const thumb = mesh(fingerGeo, skin, side * 0.12, -0.04, 0.05);
    thumb.rotation.z = side * 0.7;
    hand.add(thumb);
    return hand;
  };
  armL.add(buildHand(1));
  armR.add(buildHand(-1));
  const cuffGeo = new THREE.TorusGeometry(0.13, 0.03, 6, 14);
  const cuffL = mesh(cuffGeo, mat(0xf4efe4), 0, -0.74, 0);
  const cuffR = mesh(cuffGeo, mat(0xf4efe4), 0, -0.74, 0);
  cuffL.rotation.x = cuffR.rotation.x = Math.PI / 2;
  armL.add(cuffL);
  armR.add(cuffR);
  const legL = limb(-0.2, 1.05, 0.62, 0.15, mat(shade(hero.cloth, 0.55)));
  const legR = limb(0.2, 1.05, 0.62, 0.15, mat(shade(hero.cloth, 0.55)));
  // shoes: rounded upper, rubber sole, a stripe where the laces sit
  const upperGeo = new THREE.CapsuleGeometry(0.13, 0.22, 4, 10);
  upperGeo.rotateX(Math.PI / 2);
  const soleGeo = new THREE.BoxGeometry(0.29, 0.06, 0.46);
  const laceGeo = new THREE.BoxGeometry(0.16, 0.02, 0.14);
  const buildShoe = () => {
    const shoe = new THREE.Group();
    shoe.position.set(0, -0.95, 0.06);
    const upper = mesh(upperGeo, mat(0x5a4636));
    upper.scale.set(1.05, 0.72, 1);
    const sole = mesh(soleGeo, mat(0xefe9dc, false, 0.9), 0, -0.08, 0.01);
    const lace = mesh(laceGeo, mat(0xf7f3ea), 0, 0.085, 0.08);
    shoe.add(upper, sole, lace);
    shoe.userData.upper = upper;
    return shoe;
  };
  const shoeL = buildShoe();
  const shoeR = buildShoe();
  legL.add(shoeL);
  legR.add(shoeR);
  // shirt details: collar and a button placket
  const collar = mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 18), mat(0xf4efe4), 0, 1.98, 0.02);
  collar.rotation.x = Math.PI / 2 + 0.25;
  collar.scale.set(1.1, 0.9, 1);
  const btnGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10);
  for (let i = 0; i < 3; i++) {
    const b = mesh(btnGeo, mat(0xf4efe4, false, 0.4), 0, 1.78 - i * 0.18, 0.31);
    b.rotation.x = Math.PI / 2;
    body.add(b);
  }
  body.add(collar);

  // accessory mounts, rebuilt on every equip change
  const hatMount = new THREE.Group();
  head.add(hatMount);
  const backMount = new THREE.Group();
  backMount.position.set(0, 1.6, -0.34);
  body.add(backMount);
  const capePivot = new THREE.Group();
  capePivot.position.set(0, 2.0, -0.3);
  body.add(capePivot);
  let wings: THREE.Mesh[] = [];
  let flames: THREE.Mesh[] = [];

  function clear(g: THREE.Group) {
    while (g.children.length) g.remove(g.children[0]);
  }

  function heroHeadwear() {
    const id: HeroId = hero.id;
    if (id === "knight") {
      const helm = mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.42, 16), mat(0xd7dde6, false, 0.3, 0.6), 0, 0.28, 0);
      const plume = mesh(new THREE.ConeGeometry(0.1, 0.45, 8), mat(0xd63a3a), 0, 0.68, 0);
      hatMount.add(helm, plume);
    } else if (id === "wizard") {
      const brim = mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 20), mat(0x5a35a8), 0, 0.34, 0);
      const cone = mesh(new THREE.ConeGeometry(0.42, 1.0, 16), mat(0x5a35a8), 0, 0.84, 0);
      const star = mesh(new THREE.OctahedronGeometry(0.1), mat(0xffd447, true), 0, 1.36, 0);
      hatMount.add(brim, cone, star);
    } else if (id === "explorer") {
      const brim = mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 20), mat(0x8a6a3b), 0, 0.3, 0);
      const crown = mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.3, 16), mat(0x8a6a3b), 0, 0.46, 0);
      hatMount.add(brim, crown);
    } else if (id === "robot") {
      const ant = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), mat(0x9aa0a6, false, 0.3, 0.6), 0, 0.62, 0);
      const bulb = mesh(new THREE.SphereGeometry(0.08, 10, 8), mat(0xff5a5a, true), 0, 0.88, 0);
      hatMount.add(ant, bulb);
    }
  }

  function buildHat(id: string) {
    const d = cosmetic(id);
    if (!d || id === "hat-none") return heroHeadwear();
    const c = mat(d.color, !!d.glow);
    const a = mat(d.accent ?? d.color, !!d.glow);
    if (id === "hat-cap") {
      const crown = mesh(new THREE.SphereGeometry(0.46, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, 0.08, 0);
      crown.scale.set(1, 0.9, 1.04);
      hatMount.add(crown);
      // six stitched panels
      for (let i = 0; i < 6; i++) {
        const seam = mesh(new THREE.TorusGeometry(0.455, 0.008, 4, 20, Math.PI / 2), a, 0, 0.08, 0);
        seam.rotation.set(0, (i / 6) * Math.PI, Math.PI / 2);
        seam.scale.set(0.9, 1, 1);
        hatMount.add(seam);
      }
      // curved brim
      const brimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.03, 20, 1, false, -Math.PI / 2.6, Math.PI / 1.3);
      const brim = mesh(brimGeo, c, 0, 0.1, 0.2);
      brim.scale.set(1, 1, 0.9);
      brim.rotation.x = 0.12;
      hatMount.add(brim);
      hatMount.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), a, 0, 0.5, 0));
      const logo = mesh(new THREE.CircleGeometry(0.08, 16), a, 0, 0.3, 0.44);
      logo.rotation.x = -0.35;
      hatMount.add(logo);
    } else if (id === "hat-beanie") {
      hatMount.add(mesh(new THREE.SphereGeometry(0.47, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, 0.06, 0));
      hatMount.add(mesh(new THREE.TorusGeometry(0.44, 0.07, 8, 20), a, 0, 0.08, 0).rotateX(Math.PI / 2));
      hatMount.add(mesh(new THREE.SphereGeometry(0.13, 10, 8), a, 0, 0.58, 0));
    } else if (id === "hat-flowers") {
      hatMount.add(mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24), c, 0, 0.3, 0).rotateX(Math.PI / 2));
      const petalGeo = new THREE.SphereGeometry(0.055, 8, 6);
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.quadraticCurveTo(0.06, 0.08, 0, 0.18);
      leafShape.quadraticCurveTo(-0.06, 0.08, 0, 0);
      const leafGeo = new THREE.ShapeGeometry(leafShape, 6);
      const leafM = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, side: THREE.DoubleSide, roughness: 0.7 });
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * Math.PI * 2;
        const flower = new THREE.Group();
        flower.position.set(Math.cos(t) * 0.41, 0.34, Math.sin(t) * 0.41);
        flower.lookAt(Math.cos(t) * 2, 0.6, Math.sin(t) * 2);
        const petalM = i % 2 ? a : mat(0xfff6f0, false, 0.55);
        for (let k = 0; k < 5; k++) {
          const pa = (k / 5) * Math.PI * 2;
          const petal = mesh(petalGeo, petalM, Math.cos(pa) * 0.06, Math.sin(pa) * 0.06, 0);
          petal.scale.set(1.2, 0.8, 0.35);
          petal.rotation.z = pa;
          flower.add(petal);
        }
        flower.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0xf2b01e, false, 0.5), 0, 0, 0.02));
        const leaf = new THREE.Mesh(leafGeo, leafM);
        leaf.position.set(0.06, -0.02, -0.02);
        leaf.rotation.z = -1.9 + (i % 3) * 0.3;
        flower.add(leaf);
        hatMount.add(flower);
      }
    } else if (id === "hat-bunny") {
      [-1, 1].forEach((s) => {
        const ear = mesh(new THREE.CapsuleGeometry(0.08, 0.5, 4, 10), c, s * 0.18, 0.7, 0);
        ear.rotation.z = -s * 0.15;
        const inner = mesh(new THREE.CapsuleGeometry(0.045, 0.4, 4, 8), a, 0, 0, 0.05);
        ear.add(inner);
        hatMount.add(ear);
      });
    } else if (id === "hat-tophat") {
      hatMount.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 20), c, 0, 0.32, 0));
      hatMount.add(mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.55, 18), c, 0, 0.6, 0));
      hatMount.add(mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.1, 18), a, 0, 0.42, 0));
    } else if (id === "hat-star") {
      hatMount.add(mesh(new THREE.SphereGeometry(0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(d.color, false, 0.25, 0.7), 0, 0.02, 0));
      hatMount.add(mesh(new THREE.OctahedronGeometry(0.16), a, 0, 0.62, 0));
    } else if (id === "hat-aurora") {
      hatMount.add(mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 24), c, 0, 0.32, 0).rotateX(Math.PI / 2));
      for (let i = 0; i < 5; i++) {
        const t = (i / 5) * Math.PI * 2;
        const spike = mesh(new THREE.ConeGeometry(0.07, 0.3 + (i % 2) * 0.12, 6), i % 2 ? a : c, Math.cos(t) * 0.4, 0.5, Math.sin(t) * 0.4);
        hatMount.add(spike);
      }
    }
  }

  function buildBack(id: string) {
    wings = [];
    flames = [];
    const d = cosmetic(id);
    if (!d || id === "back-none") return;
    const c = mat(d.color, !!d.glow);
    const a = mat(d.accent ?? d.color, !!d.glow);
    if (id === "back-pack") {
      // canvas body with rounded top, front pocket, flap, buckles and straps
      const bodyG = new THREE.CapsuleGeometry(0.28, 0.32, 4, 12);
      const bag = mesh(bodyG, mat(d.color, false, 0.9), 0, 0, -0.08);
      bag.scale.set(1.05, 1, 0.55);
      const pocket = mesh(new THREE.BoxGeometry(0.42, 0.26, 0.1), mat(shade(d.color, 0.85), false, 0.9), 0, -0.16, -0.26);
      const flap = mesh(new THREE.BoxGeometry(0.5, 0.2, 0.08), a, 0, 0.22, -0.25);
      flap.rotation.x = -0.25;
      const buckleM = mat(0xc9b37a, false, 0.35, 0.6);
      const b1 = mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), buckleM, -0.12, 0.1, -0.3);
      const b2 = mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), buckleM, 0.12, 0.1, -0.3);
      const strapM = mat(0x4a3526, false, 0.8);
      const s1 = mesh(new THREE.BoxGeometry(0.07, 0.8, 0.04), strapM, -0.2, 0.05, 0.36);
      const s2 = mesh(new THREE.BoxGeometry(0.07, 0.8, 0.04), strapM, 0.2, 0.05, 0.36);
      backMount.add(bag, pocket, flap, b1, b2, s1, s2);
    } else if (id === "back-wings") {
      const wingM = new THREE.MeshStandardMaterial({ color: d.color, side: THREE.DoubleSide, transparent: true, opacity: 0.88, emissive: d.accent ?? d.color, emissiveIntensity: 0.2, roughness: 0.4 });
      const veinM = new THREE.MeshBasicMaterial({ color: 0x3a2a3a, side: THREE.DoubleSide });
      // butterfly outline: large forewing + smaller hindwing, with veins
      const fore = new THREE.Shape();
      fore.moveTo(0, 0);
      fore.bezierCurveTo(0.2, 0.5, 0.7, 0.75, 0.85, 0.45);
      fore.bezierCurveTo(0.95, 0.2, 0.55, 0.02, 0, 0);
      const hind = new THREE.Shape();
      hind.moveTo(0, 0);
      hind.bezierCurveTo(0.45, -0.05, 0.7, -0.35, 0.5, -0.6);
      hind.bezierCurveTo(0.3, -0.75, 0.05, -0.35, 0, 0);
      [-1, 1].forEach((s) => {
        const w = new THREE.Group();
        w.position.set(s * 0.06, 0.2, -0.12);
        const f = new THREE.Mesh(new THREE.ShapeGeometry(fore, 16), wingM);
        const h = new THREE.Mesh(new THREE.ShapeGeometry(hind, 16), mat(d.accent ?? d.color, false, 0.5));
        h.material = wingM;
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.09, 14), mat(d.accent ?? 0xffffff, false, 0.5));
        spot.position.set(0.55, 0.42, 0.005);
        for (let i = 0; i < 3; i++) {
          const v = new THREE.Mesh(new THREE.PlaneGeometry(0.6 - i * 0.12, 0.012), veinM);
          v.position.set(0.3, 0.1 + i * 0.12, 0.004);
          v.rotation.z = 0.35 + i * 0.2;
          w.add(v);
        }
        w.add(f, h, spot);
        w.scale.set(s, 1, 1);
        w.userData.side = s;
        backMount.add(w);
        wings.push(w as unknown as THREE.Mesh);
      });
    } else if (id === "back-jet") {
      [-1, 1].forEach((s) => {
        backMount.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 12), mat(d.color, false, 0.3, 0.6), s * 0.2, 0, -0.1));
        const fl = mesh(new THREE.ConeGeometry(0.12, 0.35, 10), a, s * 0.2, -0.5, -0.1);
        fl.rotation.x = Math.PI;
        backMount.add(fl);
        flames.push(fl);
      });
    }
  }

  function buildCape(id: string) {
    const d = cosmetic(id);
    if (!d || id === "cape-none") return;
    const capeM = new THREE.MeshStandardMaterial({ color: d.color, side: THREE.DoubleSide, roughness: 0.75 });
    const geo = new THREE.PlaneGeometry(0.95, 1.5, 8, 10);
    geo.translate(0, -0.75, 0);
    // curve the cloth around the shoulders and flare it toward the hem,
    // with soft folds, so it hangs like fabric instead of a flat card
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const t = -y / 1.5;
      const flare = 1 + t * 0.45;
      p.setX(i, x * flare);
      p.setZ(i, Math.pow(x * flare, 2) * 0.4 * (1 - t * 0.7) - Math.sin(x * 14) * 0.025 * t);
    }
    geo.computeVertexNormals();
    const cape = new THREE.Mesh(geo, capeM);
    cape.castShadow = true;
    capePivot.add(cape);
    if (d.accent !== undefined) {
      const trim = mesh(new THREE.BoxGeometry(0.98, 0.08, 0.04), mat(d.accent, !!d.glow), 0, -1.5, 0);
      cape.add(trim);
      if (id === "cape-starry") {
        for (let i = 0; i < 7; i++) {
          const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), mat(d.accent, true));
          s.position.set(((i * 37) % 9) / 10 - 0.4, -0.2 - ((i * 53) % 12) / 10, -0.01);
          cape.add(s);
        }
      }
    }
  }

  function setEquip(e: Equip) {
    const outfit = cosmetic(e.outfit);
    const top = !outfit || e.outfit === "outfit-hero" ? hero.cloth : outfit.color;
    const bottom = !outfit || e.outfit === "outfit-hero" ? shade(hero.cloth, 0.55) : (outfit.accent ?? shade(outfit.color, 0.6));
    const glow = !!outfit?.glow;
    torso.material = mat(top, glow);
    skirt.material = mat(top, glow);
    (armL.userData.seg as THREE.Mesh).material = mat(top, glow);
    (armR.userData.seg as THREE.Mesh).material = mat(top, glow);
    (legL.userData.seg as THREE.Mesh).material = mat(bottom);
    (legR.userData.seg as THREE.Mesh).material = mat(bottom);
    belt.material = mat(outfit && e.outfit !== "outfit-hero" ? (outfit.accent ?? 0x5a4636) : 0x5a4636);
    const shoes = cosmetic(e.shoes);
    const sm = mat(shoes?.color ?? 0x5a4636, !!shoes?.glow);
    (shoeL.userData.upper as THREE.Mesh).material = sm;
    (shoeR.userData.upper as THREE.Mesh).material = sm;
    clear(hatMount);
    clear(backMount);
    clear(capePivot);
    buildHat(e.hat);
    buildBack(e.back);
    buildCape(e.cape);
  }
  setEquip(equip);

  const blinkSeed = Math.random() * 3000;
  function tick(now: number, speed: number) {
    // blink every few seconds, breathe, and let the head drift a little
    const bt = (now + blinkSeed) % 3600;
    const lid = bt < 130 ? 0.12 : 1;
    eyeL.scale.y = eyeR.scale.y = lid;
    scL.scale.y = scR.scale.y = 0.85 * lid;
    const breath = Math.sin(now / 900) * (1 - Math.min(1, speed)) ;
    torso.scale.set(1 + breath * 0.012, 1 + breath * 0.018, 0.72 + breath * 0.012);
    head.rotation.y = Math.sin(now / 2300 + blinkSeed) * 0.12 * (1 - Math.min(1, speed));
    head.rotation.x = Math.sin(now / 3100) * 0.04;
    capePivot.rotation.x = 0.12 + speed * 0.55 + Math.sin(now / 260) * (0.05 + speed * 0.08);
    wings.forEach((w) => {
      const s = w.userData.side as number;
      w.rotation.y = s * (0.35 + Math.sin(now / 140) * 0.35);
    });
    flames.forEach((f, i) => {
      const k = 0.8 + Math.sin(now / 50 + i) * 0.25 + speed * 0.5;
      f.scale.set(1, k, 1);
    });
  }

  function setHeadVisible(v: boolean) {
    head.visible = v;
  }

  function dispose() {
    root.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
  }

  return { root, body, head, armL, armR, legL, legR, setEquip, tick, setHeadVisible, dispose };
}
