import { NextRequest, NextResponse } from "next/server";

import type { GeocodeResult } from "@/lib/geocode";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json([] satisfies GeocodeResult[]);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "6");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "OnFoot.walk/0.1 (https://github.com/m3mentomor1/OnFoot-walk)",
      "Accept-Language": request.headers.get("accept-language") ?? "en",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Location search is temporarily unavailable." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as GeocodeResult[];

  return NextResponse.json(
    data.map((place) => ({
      place_id: place.place_id,
      display_name: place.display_name,
      lat: place.lat,
      lon: place.lon,
    })),
  );
}
