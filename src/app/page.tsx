"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-dvh w-full bg-neutral-200" />,
});

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <MapView />
    </main>
  );
}
