"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-emerald-100 text-lg font-medium text-emerald-800">
      Menyiapkan padang rumput...
    </div>
  ),
});

export default function PlayPage() {
  return <Game />;
}
