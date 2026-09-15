"use client";

import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";

import type { GeocodeResult } from "@/lib/geocode";
import { AiChat } from "@/components/ai-chat";
import { LocationSearch } from "@/components/location-search";
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

  const [isPinMode, setIsPinMode] = useState(false);

  const [isAgentMode, setIsAgentMode] = useState(false);

  useEffect(() => {
    if (!map) {
      return;
    }

    function handleMapClick(event: L.LeafletMouseEvent) {
      if (!isPinMode || isAgentMode) {
        return;
      }

      const position: [number, number] = [
        event.latlng.lat,
        event.latlng.lng,
      ];

      setSelectedPlace({
        name: "Dropped pin",
        position,
      });

      setIsPinMode(false);
    }

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [map, isPinMode, isAgentMode]);

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

  const marker = useMemo(() => {
    if (!selectedPlace) {
      return null;
    }

    return (
      <Marker
        position={selectedPlace.position}
        icon={markerIcon}
      >
        <Popup>{selectedPlace.name}</Popup>
      </Marker>
    );
  }, [selectedPlace]);

  function handleSelect(place: GeocodeResult) {
    const position: [number, number] = [
      Number.parseFloat(place.lat),
      Number.parseFloat(place.lon),
    ];

    setSelectedPlace({
      name: place.display_name,
      position,
    });

    setIsPinMode(false);

    map?.flyTo(position, PLACE_ZOOM, {
      duration: 1.1,
    });
  }

  function handlePinModeChange(active: boolean) {
    setIsPinMode(active);
  }

  function handleAgentModeChange(active: boolean) {
    setIsAgentMode(active);

    if (active) {
      setIsPinMode(false);
    }
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      {/* AI Agent Panel */}
      {isAgentMode ? <AiChat /> : null}

      {/* Map */}
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

        {/* Map UI */}
        <div className="pointer-events-none absolute inset-0 z-[1000]">
          {/* Location Search */}
          {!isAgentMode ? (
            <div className="flex justify-center px-4 pt-4">
              <LocationSearch onSelect={handleSelect} />
            </div>
          ) : null}

          {/* Map Controls */}
          {map ? (
            <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
              <ZoomControls
                map={map}
                isPinMode={isPinMode}
                onPinModeChange={handlePinModeChange}
                isAgentMode={isAgentMode}
                onAgentModeChange={handleAgentModeChange}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}