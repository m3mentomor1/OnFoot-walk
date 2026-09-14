"use client";

import type { Map as LeafletMap } from "leaflet";
import { MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ZoomControlsProps = {
  map: LeafletMap;
  isPinMode: boolean;
  onPinModeChange: (active: boolean) => void;
};

export function ZoomControls({
  map,
  isPinMode,
  onPinModeChange,
}: ZoomControlsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Zoom Controls */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-lg">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom in"
          className="size-7 rounded-none text-neutral-800 hover:bg-neutral-100"
          onClick={() => map.zoomIn()}
        >
          <Plus className="size-4" />
        </Button>

        <div className="h-px bg-neutral-200" />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Zoom out"
          className="size-7 rounded-none text-neutral-800 hover:bg-neutral-100"
          onClick={() => map.zoomOut()}
        >
          <Minus className="size-4" />
        </Button>
      </div>

      {/* Drop Pin */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={
          isPinMode
            ? "Cancel pin placement"
            : "Drop a pin"
        }
        aria-pressed={isPinMode}
        className={
          isPinMode
            ? "size-7 rounded-xl border border-black/5 bg-neutral-100 text-neutral-900 shadow-lg hover:bg-neutral-200"
            : "size-7 rounded-xl border border-black/5 bg-white text-neutral-800 shadow-lg hover:bg-neutral-100"
        }
        onClick={() => onPinModeChange(!isPinMode)}
      >
        <MapPin className="size-4" />
      </Button>
    </div>
  );
}