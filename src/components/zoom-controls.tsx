"use client";

import type { Map as LeafletMap } from "leaflet";
import { MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ZoomControlsProps = {
  map: LeafletMap;
  isPinMode: boolean;
  onPinModeChange: (active: boolean) => void;
  isAgentMode: boolean;
  onAgentModeChange: (active: boolean) => void;
};

export function ZoomControls({
  map,
  isPinMode,
  onPinModeChange,
  isAgentMode,
  onAgentModeChange,
}: ZoomControlsProps) {
  function handleAgentModeChange(active: boolean) {
    onAgentModeChange(active);

    if (active) {
      onPinModeChange(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {!isAgentMode ? (
        <>
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
        </>
      ) : null}

      {/* AI Agent Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isAgentMode}
        aria-label={
          isAgentMode
            ? "Disable AI Agent"
            : "Enable AI Agent"
        }
        onClick={() =>
          handleAgentModeChange(!isAgentMode)
        }
        className={
          isAgentMode
            ? "flex size-7 items-center justify-center rounded-xl border border-black/5 bg-neutral-800 shadow-lg transition-colors hover:bg-neutral-700"
            : "flex size-7 items-center justify-center rounded-xl border border-black/5 bg-white shadow-lg transition-colors hover:bg-neutral-100"
        }
      >
        <span
          className={
            isAgentMode
              ? "relative flex h-4 w-4 items-center justify-center rounded-full bg-white"
              : "relative flex h-4 w-4 items-center justify-center rounded-full bg-neutral-300"
          }
        >
          <span
            className={
              isAgentMode
                ? "size-1.5 rounded-full bg-neutral-800"
                : "size-1.5 rounded-full bg-neutral-500"
            }
          />
        </span>
      </button>
    </div>
  );
}