"use client";

import { Bot, MapPin } from "lucide-react";

type ModeSwitchProps = {
  isAgentMode: boolean;
  onChange: (active: boolean) => void;
};

export function ModeSwitch({
  isAgentMode,
  onChange,
}: ModeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAgentMode}
      aria-label={
        isAgentMode
          ? "Switch to manual mode"
          : "Switch to AI agent mode"
      }
      onClick={() => onChange(!isAgentMode)}
      className={`
        relative
        grid
        h-14
        w-7
        shrink-0
        place-items-center
        overflow-hidden
        rounded-lg
        border
        border-black/5
        p-0
        shadow-lg
        transition-colors
        duration-200
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-neutral-400
        focus-visible:ring-offset-2
        ${isAgentMode ? "bg-neutral-800" : "bg-white"}
      `}
    >
      {/* Manual mode */}
      <MapPin
        className={`
          pointer-events-none
          absolute
          left-1/2
          top-2
          z-10
          block
          size-3
          -translate-x-1/2
          transition-colors
          duration-200
          ${isAgentMode ? "text-neutral-500" : "text-neutral-800"}
        `}
        aria-hidden
      />

      {/* AI Agent mode */}
      <Bot
        className={`
          pointer-events-none
          absolute
          bottom-2
          left-1/2
          z-10
          block
          size-3
          -translate-x-1/2
          transition-colors
          duration-200
          ${isAgentMode ? "text-white" : "text-neutral-400"}
        `}
        aria-hidden
      />

      {/* Highlight */}
      <span
        className={`
          pointer-events-none
          absolute
          left-1/2
          z-0
          block
          size-5
          -translate-x-1/2
          rounded-full
          shadow-sm
          transition-all
          duration-200
          ease-out
          ${
            isAgentMode
              ? "top-[30px] bg-neutral-700"
              : "top-[4px] bg-neutral-100"
          }
        `}
      />
    </button>
  );
}