"use client";

// Live 3D turntable of the character wearing the selected outfit, so every
// wardrobe item is shown rendered on the hero rather than as a flat icon.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildAvatar, type Avatar, type Equip } from "@/lib/game/avatar";
import { HEROES, type HeroId } from "@/lib/progression";

export default function AvatarPreview({ hero, equip }: { hero: HeroId; equip: Equip }) {
  const ref = useRef<HTMLDivElement>(null);
  const avRef = useRef<Avatar | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, el.clientWidth / el.clientHeight, 0.1, 50);
    cam.position.set(0, 2.1, 8.2);
    cam.lookAt(0, 1.6, 0);
    scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x8fc98a, 1.6));
    const key = new THREE.DirectionalLight(0xfff2d8, 2.4);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fd0ff, 1.4);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.6, 0.18, 40),
      new THREE.MeshStandardMaterial({ color: 0xeef7ea, roughness: 0.6 })
    );
    stage.position.y = -0.09;
    scene.add(stage);
    const def = HEROES.find((h) => h.id === hero)!;
    const av = buildAvatar(def, equip);
    avRef.current = av;
    scene.add(av.root);
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      av.root.rotation.y = Math.sin(now / 1800) * 0.9 + 0.3;
      av.armL.rotation.x = Math.sin(now / 500) * 0.15;
      av.armR.rotation.x = -Math.sin(now / 500) * 0.15;
      av.tick(now, 0.25);
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      av.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      avRef.current = null;
    };
    // equip changes are applied below without rebuilding the renderer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero]);

  useEffect(() => {
    avRef.current?.setEquip(equip);
  }, [equip]);

  return <div ref={ref} className="h-56 w-full sm:h-72" data-testid="avatar-preview" />;
}
