export type WalkabilityCategory =
  | "grocery"
  | "transit"
  | "food"
  | "healthcare"
  | "parks"
  | "schools"
  | "pedestrian";

export type WalkabilityPlace = {
  id: string;
  name: string;
  category: WalkabilityCategory;
  lat: number;
  lon: number;
  distance: number;
};

export type WalkabilityResult = {
  score: number;
  rating: string;
  categories: {
    grocery: number;
    transit: number;
    food: number;
    healthcare: number;
    parks: number;
    schools: number;
    pedestrian: number;
  };
  nearbyPlaces: WalkabilityPlace[];
};

type AmenityCategory = Exclude<
  WalkabilityCategory,
  "pedestrian"
>;

const CATEGORY_WEIGHTS: Record<
  AmenityCategory,
  number
> = {
  grocery: 0.20,
  transit: 0.20,
  food: 0.15,
  healthcare: 0.10,
  parks: 0.10,
  schools: 0.10,
};

const PEDESTRIAN_WEIGHT = 0.05;
const DIVERSITY_WEIGHT = 0.10;

const SEARCH_RADIUS_METERS = 1000;
const DISTANCE_DECAY_METERS = 500;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadius = 6_371_000;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const deltaLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const deltaLon =
    ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) ** 2;

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function distanceScore(distance: number) {
  return (
    100 *
    Math.exp(
      -distance / DISTANCE_DECAY_METERS,
    )
  );
}

function calculateCategoryScore(
  places: WalkabilityPlace[],
  category: AmenityCategory,
) {
  const categoryPlaces = places
    .filter((place) => place.category === category)
    .sort((a, b) => a.distance - b.distance);

  if (categoryPlaces.length === 0) {
    return 0;
  }

  const nearestScore = distanceScore(
    categoryPlaces[0].distance,
  );

  /*
   * A second component rewards having multiple
   * options nearby, but with diminishing returns.
   *
   * 1 place  -> ~28%
   * 2 places -> ~49%
   * 3 places -> ~63%
   * 4 places -> ~72%
   * 5+       -> ~81%+
   */
  const densityBonus =
    100 *
    (1 -
      Math.exp(
        -Math.min(categoryPlaces.length, 8) / 3,
      ));

  return clamp(
    nearestScore * 0.70 +
      densityBonus * 0.30,
    0,
    100,
  );
}

function calculatePedestrianScore(
  places: WalkabilityPlace[],
) {
  const pedestrianPlaces = places.filter(
    (place) => place.category === "pedestrian",
  );

  if (pedestrianPlaces.length === 0) {
    return 0;
  }

  const nearestScore = distanceScore(
    pedestrianPlaces[0].distance,
  );

  const densityBonus =
    100 *
    (1 -
      Math.exp(
        -Math.min(pedestrianPlaces.length, 15) / 5,
      ));

  return clamp(
    nearestScore * 0.60 +
      densityBonus * 0.40,
    0,
    100,
  );
}

function calculateDiversityScore(
  places: WalkabilityPlace[],
) {
  const categories = new Set(
    places
      .filter(
        (place) =>
          place.category !== "pedestrian",
      )
      .map((place) => place.category),
  );

  /*
   * Six useful amenity categories are considered.
   *
   * 0 categories = 0
   * 1 category  = 16.7
   * ...
   * 6 categories = 100
   */
  return (categories.size / 6) * 100;
}

export function calculateWalkability(
  places: WalkabilityPlace[],
): WalkabilityResult {
  const grocery = calculateCategoryScore(
    places,
    "grocery",
  );

  const transit = calculateCategoryScore(
    places,
    "transit",
  );

  const food = calculateCategoryScore(
    places,
    "food",
  );

  const healthcare = calculateCategoryScore(
    places,
    "healthcare",
  );

  const parks = calculateCategoryScore(
    places,
    "parks",
  );

  const schools = calculateCategoryScore(
    places,
    "schools",
  );

  const pedestrian =
    calculatePedestrianScore(places);

  const diversity =
    calculateDiversityScore(places);

  const weightedAmenityScore =
    grocery * CATEGORY_WEIGHTS.grocery +
    transit * CATEGORY_WEIGHTS.transit +
    food * CATEGORY_WEIGHTS.food +
    healthcare * CATEGORY_WEIGHTS.healthcare +
    parks * CATEGORY_WEIGHTS.parks +
    schools * CATEGORY_WEIGHTS.schools;

  const score =
    weightedAmenityScore +
    pedestrian * PEDESTRIAN_WEIGHT +
    diversity * DIVERSITY_WEIGHT;

  const roundedScore = Math.round(
    clamp(score, 0, 100),
  );

  let rating = "Poor";

  if (roundedScore >= 80) {
    rating = "Excellent";
  } else if (roundedScore >= 65) {
    rating = "Good";
  } else if (roundedScore >= 50) {
    rating = "Moderate";
  } else if (roundedScore >= 35) {
    rating = "Fair";
  }

  return {
    score: roundedScore,
    rating,
    categories: {
      grocery: Math.round(grocery),
      transit: Math.round(transit),
      food: Math.round(food),
      healthcare: Math.round(healthcare),
      parks: Math.round(parks),
      schools: Math.round(schools),
      pedestrian: Math.round(pedestrian),
    },
    nearbyPlaces: places
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 30),
  };
}

export { SEARCH_RADIUS_METERS };