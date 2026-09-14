"use client";

import type { Map as LeafletMap } from "leaflet";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type ZoomControlsProps = {
  map: LeafletMap;
};

export function ZoomControls({ map }: ZoomControlsProps) {
  return (
    <div className="pointer-events-auto flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-lg">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Zoom in"
        className="rounded-none text-neutral-800 hover:bg-neutral-100"
        onClick={() => map.zoomIn()}
      >
        <Plus className="size-5" />
      </Button>
      <div className="h-px bg-neutral-200" />
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="Zoom out"
        className="rounded-none text-neutral-800 hover:bg-neutral-100"
        onClick={() => map.zoomOut()}
      >
        <Minus className="size-5" />
      </Button>
    </div>
  );
}
