"use client";

import { Loader2, MapPin, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GeocodeResult } from "@/lib/geocode";
import { cn } from "@/lib/utils";

type LocationSearchProps = {
  onSelect: (place: GeocodeResult) => void;
};

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as GeocodeResult[];
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setError("Could not find locations. Try again.");
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  function selectPlace(place: GeocodeResult) {
    setQuery(place.display_name);
    setOpen(false);
    setResults([]);
    onSelect(place);
    inputRef.current?.blur();
  }

  function clearQuery() {
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="pointer-events-auto relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-1.5 shadow-lg">
        <Search className="size-5 shrink-0 text-neutral-500" aria-hidden />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0 || error) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) =>
                Math.min(index + 1, results.length - 1),
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter") {
              const place =
                activeIndex >= 0 ? results[activeIndex] : results[0];
              if (place) {
                event.preventDefault();
                selectPlace(place);
              }
            }

            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search a location"
          className="h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 md:text-base"
        />
        {loading ? (
          <Loader2
            className="size-5 shrink-0 animate-spin text-neutral-400"
            aria-label="Searching"
          />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            className="rounded-full text-neutral-500 hover:bg-neutral-100"
            onClick={clearQuery}
          >
            <X />
          </Button>
        ) : null}
      </div>

      {open && (error || results.length > 0) ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-black/5 bg-white py-1 shadow-lg"
        >
          {error ? (
            <li className="px-4 py-3 text-sm text-neutral-500">{error}</li>
          ) : (
            results.map((place, index) => (
              <li key={place.place_id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm text-neutral-800 transition-colors hover:bg-neutral-50",
                    index === activeIndex && "bg-neutral-100",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectPlace(place)}
                >
                  <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-500" />
                  <span>{place.display_name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
