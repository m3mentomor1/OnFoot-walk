import { NextRequest, NextResponse } from "next/server";

import {
  calculateWalkability,
  haversineDistance,
  SEARCH_RADIUS_METERS,
  type WalkabilityCategory,
  type WalkabilityPlace,
} from "@/lib/walkability";

const OVERPASS_URL =
  "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

function getCoordinates(
  element: OverpassElement,
) {
  if (
    typeof element.lat === "number" &&
    typeof element.lon === "number"
  ) {
    return {
      lat: element.lat,
      lon: element.lon,
    };
  }

  if (element.center) {
    return {
      lat: element.center.lat,
      lon: element.center.lon,
    };
  }

  return null;
}

function classifyElement(
  tags: Record<string, string>,
): WalkabilityCategory | null {
  // Grocery / daily needs
  if (
    tags.shop === "supermarket" ||
    tags.shop === "convenience" ||
    tags.shop === "greengrocer" ||
    tags.shop === "bakery" ||
    tags.shop === "general"
  ) {
    return "grocery";
  }

  // Public transit
  if (
    tags.highway === "bus_stop" ||
    tags.public_transport === "platform" ||
    tags.public_transport === "stop_position" ||
    tags.amenity === "bus_station" ||
    tags.railway === "station" ||
    tags.railway === "halt" ||
    tags.railway === "tram_stop"
  ) {
    return "transit";
  }

  // Food
  if (
    tags.amenity === "restaurant" ||
    tags.amenity === "cafe" ||
    tags.amenity === "fast_food" ||
    tags.amenity === "food_court"
  ) {
    return "food";
  }

  // Healthcare
  if (
    tags.amenity === "hospital" ||
    tags.amenity === "clinic" ||
    tags.amenity === "doctors" ||
    tags.amenity === "dentist" ||
    tags.amenity === "pharmacy"
  ) {
    return "healthcare";
  }

  // Parks / recreation
  if (
    tags.leisure === "park" ||
    tags.leisure === "playground" ||
    tags.leisure === "garden" ||
    tags.leisure === "pitch" ||
    tags.leisure === "sports_centre" ||
    tags.tourism === "picnic_site"
  ) {
    return "parks";
  }

  // Education
  if (
    tags.amenity === "school" ||
    tags.amenity === "college" ||
    tags.amenity === "university" ||
    tags.amenity === "kindergarten"
  ) {
    return "schools";
  }

  // Pedestrian infrastructure
  if (
    tags.highway === "footway" ||
    tags.highway === "pedestrian" ||
    tags.highway === "path" ||
    tags.highway === "crossing" ||
    tags.footway === "sidewalk"
  ) {
    return "pedestrian";
  }

  return null;
}

function getPlaceName(
  tags: Record<string, string>,
  category: WalkabilityCategory,
) {
  if (tags.name) {
    return tags.name;
  }

  const defaults: Record<
    WalkabilityCategory,
    string
  > = {
    grocery: "Grocery / shop",
    transit: "Transit stop",
    food: "Food establishment",
    healthcare: "Healthcare facility",
    parks: "Park / recreation",
    schools: "School",
    pedestrian: "Pedestrian infrastructure",
  };

  return defaults[category];
}

export async function GET(
  request: NextRequest,
) {
  const latParam =
    request.nextUrl.searchParams.get("lat");

  const lonParam =
    request.nextUrl.searchParams.get("lon");

  if (!latParam || !lonParam) {
    return NextResponse.json(
      {
        error:
          "Latitude and longitude are required.",
      },
      { status: 400 },
    );
  }

  const latitude = Number.parseFloat(latParam);
  const longitude = Number.parseFloat(lonParam);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      {
        error: "Invalid coordinates.",
      },
      { status: 400 },
    );
  }

  /*
   * Only request the OSM features that can
   * actually contribute to the walkability score.
   */
  const query = `
[out:json][timeout:15];

(
  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[shop~"supermarket|convenience|greengrocer|bakery|general"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[amenity~"restaurant|cafe|fast_food|food_court|hospital|clinic|doctors|dentist|pharmacy|school|college|university|kindergarten|bus_station"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[leisure~"park|playground|garden|pitch|sports_centre"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[tourism="picnic_site"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[highway~"bus_stop|footway|pedestrian|path|crossing"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[public_transport~"platform|stop_position"];

  nwr(
    around:${SEARCH_RADIUS_METERS},
    ${latitude},
    ${longitude}
  )[railway~"station|halt|tram_stop"];
);

out center tags;
`;

  try {
    const response = await fetch(
      OVERPASS_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          "User-Agent":
            "OnFoot.walk/1.0",
        },
        body: new URLSearchParams({
          data: query,
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Overpass API error:",
        response.status,
        errorText,
      );

      return NextResponse.json(
        {
          error:
            "OpenStreetMap data service is temporarily unavailable.",
          details: errorText.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const data =
      (await response.json()) as {
        elements?: OverpassElement[];
      };

    const elements = data.elements ?? [];

    const places: WalkabilityPlace[] = [];

    const seen = new Set<string>();

    for (const element of elements) {
      if (!element.tags) {
        continue;
      }

      const category = classifyElement(
        element.tags,
      );

      if (!category) {
        continue;
      }

      const coordinates =
        getCoordinates(element);

      if (!coordinates) {
        continue;
      }

      const distance = haversineDistance(
        latitude,
        longitude,
        coordinates.lat,
        coordinates.lon,
      );

      if (
        distance >
        SEARCH_RADIUS_METERS
      ) {
        continue;
      }

      const id =
        `${element.type}/${element.id}/${category}`;

      if (seen.has(id)) {
        continue;
      }

      seen.add(id);

      places.push({
        id,
        name: getPlaceName(
          element.tags,
          category,
        ),
        category,
        lat: coordinates.lat,
        lon: coordinates.lon,
        distance,
      });
    }

    const result =
      calculateWalkability(places);

    return NextResponse.json({
      ...result,

      coordinates: {
        latitude,
        longitude,
      },

      radius:
        SEARCH_RADIUS_METERS,

      source: "OpenStreetMap",
    });
  } catch (error) {
    console.error(
      "Walkability API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to connect to the OpenStreetMap data service.",
      },
      { status: 502 },
    );
  }
}