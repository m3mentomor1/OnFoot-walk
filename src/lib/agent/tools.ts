import { tool } from "@langchain/core/tools";
import { z } from "zod";

const NOMINATIM_URL =
  "https://nominatim.openstreetmap.org/search";

const GEOCODE_RESULT_LIMIT = 5;

export const searchLocation = tool(
  async ({ query }) => {
    try {
      const params = new URLSearchParams({
        q: query,
        format: "json",
        limit: String(GEOCODE_RESULT_LIMIT),
        addressdetails: "1",
      });

      const response = await fetch(
        `${NOMINATIM_URL}?${params.toString()}`,
        {
          headers: {
            "User-Agent": "OnFoot.walk/1.0",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        return JSON.stringify({
          success: false,
          error: "Location search failed.",
        });
      }

      const data = await response.json();

      const results = data.map(
        (item: {
          place_id: number;
          display_name: string;
          lat: string;
          lon: string;
          type?: string;
        }) => ({
          id: String(item.place_id),
          name: item.display_name,
          lat: Number.parseFloat(item.lat),
          lon: Number.parseFloat(item.lon),
          type: item.type ?? "location",
        }),
      );

      if (results.length === 0) {
        return JSON.stringify({
          success: false,
          query,
          results: [],
          error: `No location was found for "${query}".`,
        });
      }

      return JSON.stringify({
        success: true,
        query,
        results,
      });
    } catch (error) {
      console.error(
        "Agent location search error:",
        error,
      );

      return JSON.stringify({
        success: false,
        error:
          "Unable to connect to the location search service.",
      });
    }
  },
  {
    name: "search_location",
    description:
      "Search OpenStreetMap for a real-world location. Use this when the user asks to find, search for, locate, or go to a place.",
    schema: z.object({
      query: z
        .string()
        .min(1)
        .describe(
          "The location the user wants to find.",
        ),
    }),
  },
);

export const zoomMap = tool(
  async ({ direction, amount }) => {
    const steps = Math.min(
      Math.max(amount ?? 1, 1),
      5,
    );

    return JSON.stringify({
      success: true,
      action: "zoom_map",
      direction,
      amount: steps,
    });
  },
  {
    name: "zoom_map",
    description:
      "Zoom the map in or out. Use this when the user explicitly asks to zoom in or zoom out.",
    schema: z.object({
      direction: z
        .enum(["in", "out"])
        .describe(
          "The direction of the zoom.",
        ),

      amount: z
        .number()
        .int()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "Number of zoom levels. Defaults to 1.",
        ),
    }),
  },
);

export const panMap = tool(
  async ({
    latitude,
    longitude,
  }) => {
    return JSON.stringify({
      success: true,
      action: "pan_map",
      latitude,
      longitude,
    });
  },
  {
    name: "pan_map",
    description:
      "Move the map to exact geographic coordinates without changing the current zoom level.",
    schema: z.object({
      latitude: z
        .number()
        .min(-90)
        .max(90),

      longitude: z
        .number()
        .min(-180)
        .max(180),
    }),
  },
);

export const setMapLocation = tool(
  async ({
    latitude,
    longitude,
    label,
  }) => {
    return JSON.stringify({
      success: true,
      action: "set_map_location",
      latitude,
      longitude,
      label:
        label ?? "Selected location",
    });
  },
  {
    name: "set_map_location",
    description:
      "Move the map to a location and set it as the current selected map location. Use this after successfully searching for a location.",
    schema: z.object({
      latitude: z
        .number()
        .min(-90)
        .max(90),

      longitude: z
        .number()
        .min(-180)
        .max(180),

      label: z
        .string()
        .optional()
        .describe(
          "Human-readable name of the selected location.",
        ),
    }),
  },
);