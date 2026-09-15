"use client";

import { Minus, Plus } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";

type ZoomControlsProps = {
  map: LeafletMap;
};

export function ZoomControls({
  map,
}: ZoomControlsProps) {
  return (
    <div
      className="
        w-7
        shrink-0
        overflow-hidden
        rounded-lg
        border border-black/5
        bg-white
        shadow-lg
      "
    >
      <button
        type="button"
        aria-label="Zoom in"
        onClick={() => map.zoomIn()}
        className="
          grid
          h-7
          w-full
          place-items-center
          p-0
          leading-none
          text-neutral-700
          transition-colors
          hover:bg-neutral-50
          focus-visible:z-10
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-inset
          focus-visible:ring-neutral-400
        "
      >
        <Plus
          className="block size-3.5"
          aria-hidden
        />
      </button>

      <div className="h-px w-full bg-neutral-100" />

      <button
        type="button"
        aria-label="Zoom out"
        onClick={() => map.zoomOut()}
        className="
          grid
          h-7
          w-full
          place-items-center
          p-0
          leading-none
          text-neutral-700
          transition-colors
          hover:bg-neutral-50
          focus-visible:z-10
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-inset
          focus-visible:ring-neutral-400
        "
      >
        <Minus
          className="block size-3.5"
          aria-hidden
        />
      </button>
    </div>
  );
}