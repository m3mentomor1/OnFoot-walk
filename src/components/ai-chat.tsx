"use client";

import { Send, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AiChat() {
  const [message, setMessage] = useState("");

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    // AI agent integration will be added later.
    console.log("AI Agent message:", trimmed);

    setMessage("");
  }

  return (
    <aside className="flex h-full w-[380px] max-w-[85vw] shrink-0 flex-col border-r border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-neutral-200 px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-100">
          <Sparkles className="size-4 text-neutral-700" />
        </div>

        <div>
          <h2 className="text-sm font-medium text-neutral-900">
            AI Agent
          </h2>

          <p className="text-xs text-neutral-500">
            Ask about the map
          </p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-xl bg-neutral-100 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-neutral-700">
            Hi! I&apos;m your geospatial AI agent. Ask me
            about locations, routes, hazards, or anything
            related to the map.
          </p>
        </div>
      </div>

      {/* Chat Input */}
      <div className="shrink-0 border-t border-neutral-200 p-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >
          <Input
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Ask or give me a task..."
            className="h-8 rounded-lg border-neutral-200 bg-neutral-50 px-2.5 text-xs md:text-xs placeholder:text-xs shadow-none focus-visible:ring-2"
          />

          <Button
            type="submit"
            size="icon-sm"
            aria-label="Send message"
            className="size-8 shrink-0 rounded-lg"
            disabled={!message.trim()}
          >
            <Send className="size-3.5" />
          </Button>
        </form>
      </div>
    </aside>
  );
}