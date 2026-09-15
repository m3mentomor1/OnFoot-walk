import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      {
        error: "Latitude and longitude are required.",
      },
      { status: 400 },
    );
  }

  const latitude = Number.parseFloat(lat);
  const longitude = Number.parseFloat(lon);

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

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
        latitude,
      )}&lon=${encodeURIComponent(
        longitude,
      )}&format=json`,
      {
        headers: {
          "User-Agent": "OnFoot.walk/1.0",
        },
        next: {
          revalidate: 0,
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Reverse geocoding failed.",
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      display_name:
        data.display_name ?? "Unknown location",
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to the geocoding service.",
      },
      { status: 500 },
    );
  }
}