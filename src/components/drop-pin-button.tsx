"use client";

import { MapPin } from "lucide-react";

type DropPinButtonProps = {
  isPinMode: boolean;
  onChange: (active: boolean) => void;
};

export function DropPinButton({
  isPinMode,
  onChange,
}: DropPinButtonProps) {
  return (
    <button
      type="button"
      aria-label={
        isPinMode
          ? "Cancel drop pin"
          : "Drop pin"
      }
      aria-pressed={isPinMode}
      onClick={() => onChange(!isPinMode)}
      className={`
        flex
        h-7
        w-7
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        p-0
        shadow-lg
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-neutral-400
        focus-visible:ring-offset-1
        ${
          isPinMode
            ? "border-black/10 bg-neutral-100 text-neutral-900"
            : "border-black/5 bg-white text-neutral-700 hover:bg-neutral-50"
        }
      `}
    >
      <MapPin
        className="size-3.5 shrink-0"
        aria-hidden
      />
    </button>
  );
}