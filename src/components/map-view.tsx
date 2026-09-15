"use client";

import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import type { GeocodeResult } from "@/lib/geocode";
import type { WalkabilityResult } from "@/lib/walkability";

import { AiChat } from "@/components/ai-chat";
import { LocationSearch } from "@/components/location-search";
import { DropPinButton } from "@/components/drop-pin-button";
import { ModeSwitch } from "@/components/mode-switch";
import { ZoomControls } from "@/components/zoom-controls";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 3;
const PLACE_ZOOM = 16;

const markerIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type SelectedPlace = {
  name: string;
  position: [number, number];
};

export default function MapView() {
  const [map, setMap] = useState<LeafletMap | null>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<SelectedPlace | null>(null);

  const [walkability, setWalkability] =
    useState<WalkabilityResult | null>(null);

  const [isCalculating, setIsCalculating] =
    useState(false);

  const [isPinMode, setIsPinMode] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);

  /*
   * Stores completed walkability results.
   *
   * The cache survives React re-renders because it is
   * stored inside a ref rather than being recreated
   * on every render.
   */
  const walkabilityCache = useRef(
    new Map<string, WalkabilityResult>(),
  );

  /*
   * Stores requests that are currently in progress.
   *
   * This prevents duplicate requests if the same
   * location is selected multiple times before the
   * first request finishes.
   */
  const walkabilityRequests = useRef(
    new Map<string, Promise<WalkabilityResult>>(),
  );

  /*
   * Create a stable cache key from coordinates.
   *
   * Five decimal places gives approximately meter-level
   * precision, which is more than sufficient for the
   * walkability analysis.
   */
  function getWalkabilityCacheKey(
    position: [number, number],
  ) {
    return `${position[0].toFixed(5)},${position[1].toFixed(5)}`;
  }

  /*
   * Fetch walkability data, using the client-side cache
   * whenever possible.
   */
  async function getWalkability(
    position: [number, number],
  ): Promise<WalkabilityResult> {
    const cacheKey =
      getWalkabilityCacheKey(position);

    /*
     * 1. Check completed results first.
     */
    const cachedResult =
      walkabilityCache.current.get(cacheKey);

    if (cachedResult) {
      console.log(
        "Walkability cache hit:",
        cacheKey,
      );

      return cachedResult;
    }

    /*
     * 2. Check whether the same request is already
     *    being processed.
     */
    const existingRequest =
      walkabilityRequests.current.get(cacheKey);

    if (existingRequest) {
      console.log(
        "Walkability request already in progress:",
        cacheKey,
      );

      return existingRequest;
    }

    /*
     * 3. Make a new request.
     */
    console.log(
      "Fetching walkability:",
      cacheKey,
    );

    const request = fetch(
      `/api/walkability?lat=${encodeURIComponent(
        position[0],
      )}&lon=${encodeURIComponent(
        position[1],
      )}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Walkability calculation failed: ${response.status}`,
          );
        }

        return (await response.json()) as WalkabilityResult;
      })
      .then((result) => {
        /*
         * 4. Save the successful result.
         */
        walkabilityCache.current.set(
          cacheKey,
          result,
        );

        console.log(
          "Walkability cached:",
          cacheKey,
        );

        return result;
      })
      .finally(() => {
        /*
         * 5. Remove the in-flight request.
         *
         * The completed result now lives in the normal
         * cache, so this request entry is no longer needed.
         */
        walkabilityRequests.current.delete(
          cacheKey,
        );
      });

    /*
     * Store the request immediately so that another
     * click on the same location can reuse it.
     */
    walkabilityRequests.current.set(
      cacheKey,
      request,
    );

    return request;
  }

  /*
   * Handle map clicks when Drop Pin mode is active.
   */
  useEffect(() => {
    if (!map) {
      return;
    }

    async function handleMapClick(
      event: L.LeafletMouseEvent,
    ) {
      if (!isPinMode || isAgentMode) {
        return;
      }

      const position: [number, number] = [
        event.latlng.lat,
        event.latlng.lng,
      ];

      /*
       * Immediately display the pin while both
       * reverse geocoding and walkability analysis
       * are being processed.
       */
      setSelectedPlace({
        name: "Finding location...",
        position,
      });

      setWalkability(null);
      setIsCalculating(true);
      setIsPinMode(false);

      try {
        /*
         * Run reverse geocoding and walkability
         * analysis at the same time.
         *
         * Walkability itself may come directly from
         * the cache and therefore avoid a network request.
         */
        const [reverseGeocodeResponse, walkabilityResult] =
          await Promise.all([
            fetch(
              `/api/reverse-geocode?lat=${encodeURIComponent(
                position[0],
              )}&lon=${encodeURIComponent(
                position[1],
              )}`,
            ),
            getWalkability(position),
          ]);

        /*
         * Reverse geocoding.
         */
        if (!reverseGeocodeResponse.ok) {
          throw new Error(
            `Reverse geocoding failed: ${reverseGeocodeResponse.status}`,
          );
        }

        const reverseGeocodeData =
          (await reverseGeocodeResponse.json()) as {
            display_name?: string;
          };

        setSelectedPlace({
          name:
            reverseGeocodeData.display_name ??
            "Unknown location",
          position,
        });

        /*
         * Walkability result.
         */
        setWalkability(walkabilityResult);
      } catch (error) {
        console.error(
          "Location analysis failed:",
          error,
        );

        /*
         * We keep the pin even if one of the services
         * fails.
         */
        setSelectedPlace({
          name: "Unknown location",
          position,
        });

        setWalkability(null);
      } finally {
        setIsCalculating(false);
      }
    }

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isPinMode, isAgentMode]);

  /*
   * Leaflet needs its size recalculated when the AI
   * sidebar opens/closes.
   */
  useEffect(() => {
    if (!map) {
      return;
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [map, isAgentMode]);

  /*
   * Build the marker and popup.
   */
  const marker = useMemo(() => {
    if (!selectedPlace) {
      return null;
    }

    const [latitude, longitude] =
      selectedPlace.position;

    return (
      <Marker
        position={selectedPlace.position}
        icon={markerIcon}
      >
        <Popup>
          <div className="min-w-[220px]">
            {isCalculating ? (
              <div className="mb-3">
                <p className="text-sm font-medium text-neutral-900">
                  Analyzing walkability...
                </p>

                <p className="mt-1 text-[10px] leading-normal text-neutral-500">
                  Checking nearby OpenStreetMap
                  features.
                </p>
              </div>
            ) : walkability ? (
              <div className="mb-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Walkability Score
                </p>

                <div className="mt-1 flex items-end gap-1">
                  <span className="text-2xl font-semibold leading-none text-neutral-900">
                    {walkability.score}
                  </span>

                  <span className="mb-0.5 text-xs text-neutral-400">
                    /100
                  </span>
                </div>

                <p className="mt-1 text-xs font-medium text-neutral-700">
                  {walkability.rating}
                </p>

                <div className="mt-3 border-t border-neutral-200 pt-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Breakdown
                  </p>

                  <div className="mt-1.5 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Grocery
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.grocery}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Transit
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.transit}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Food
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.food}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Healthcare
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.healthcare}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Parks
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.parks}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Schools
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.schools}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500">
                        Pedestrian
                      </span>
                      <span className="font-medium text-neutral-700">
                        {walkability.categories.pedestrian}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="border-t border-neutral-200 pt-2">
              <p className="text-sm font-medium leading-snug text-neutral-900">
                {selectedPlace.name}
              </p>

              <p className="mt-1 text-[10px] leading-normal text-neutral-500">
                {latitude.toFixed(6)},{" "}
                {longitude.toFixed(6)}
              </p>
            </div>

            {walkability &&
            walkability.nearbyPlaces.length > 0 ? (
              <div className="mt-3 border-t border-neutral-200 pt-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  Nearby
                </p>

                <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
                  {walkability.nearbyPlaces
                    .slice(0, 5)
                    .map((place) => (
                      <div
                        key={place.id}
                        className="flex items-start justify-between gap-2 text-[10px]"
                      >
                        <span className="min-w-0 truncate text-neutral-600">
                          {place.name}
                        </span>

                        <span className="shrink-0 text-neutral-400">
                          {Math.round(
                            place.distance,
                          )}
                          m
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </Popup>
      </Marker>
    );
  }, [
    selectedPlace,
    walkability,
    isCalculating,
  ]);

  /*
   * Handle a location selected from the search box.
   */
  async function handleSelect(
    place: GeocodeResult,
  ) {
    const position: [number, number] = [
      Number.parseFloat(place.lat),
      Number.parseFloat(place.lon),
    ];

    setSelectedPlace({
      name: place.display_name,
      position,
    });

    setWalkability(null);
    setIsCalculating(true);
    setIsPinMode(false);

    map?.flyTo(position, PLACE_ZOOM, {
      duration: 1.1,
    });

    try {
      const walkabilityResult =
        await getWalkability(position);

      setWalkability(walkabilityResult);
    } catch (error) {
      console.error(
        "Walkability calculation failed:",
        error,
      );

      setWalkability(null);
    } finally {
      setIsCalculating(false);
    }
  }

  /*
   * Handle switching between Map and AI Agent modes.
   */
  function handleAgentModeChange(
    active: boolean,
  ) {
    setIsAgentMode(active);

    if (active) {
      setIsPinMode(false);
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {isAgentMode ? <AiChat /> : null}

      <div className="relative h-full min-w-0 flex-1">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className={
            isPinMode
              ? "h-full w-full cursor-crosshair"
              : "h-full w-full"
          }
          ref={setMap}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {marker}
        </MapContainer>

        <div className="pointer-events-none absolute inset-0 z-[1000]">
          {!isAgentMode ? (
            <div className="flex justify-center px-4 pt-4">
              <LocationSearch
                onSelect={handleSelect}
              />
            </div>
          ) : null}

          {map ? (
            <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-2">
                {!isAgentMode ? (
                  <>
                    <ZoomControls map={map} />

                    <DropPinButton
                      isPinMode={isPinMode}
                      onChange={setIsPinMode}
                    />

                    <ModeSwitch
                      isAgentMode={isAgentMode}
                      onChange={
                        handleAgentModeChange
                      }
                    />
                  </>
                ) : (
                  <ModeSwitch
                    isAgentMode={isAgentMode}
                    onChange={
                      handleAgentModeChange
                    }
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}