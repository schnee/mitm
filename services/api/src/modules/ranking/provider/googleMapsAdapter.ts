import type { PreferenceTag, RankingCandidate } from "../contracts";

interface Coordinates {
  lat: number;
  lng: number;
}

interface PlaceSearchResponse {
  results?: Array<{
    place_id?: string;
    name?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
    types?: string[];
    opening_hours?: { open_now?: boolean };
  }>;
}

interface DistanceMatrixResponse {
  rows?: Array<{
    elements?: Array<{
      duration?: { value?: number };
      status?: string;
    }>;
  }>;
}

const TAG_TO_QUERY: Record<PreferenceTag, string> = {
  coffee: "coffee",
  cocktails: "cocktail",
  vintage_shops: "vintage shop",
  dessert: "dessert",
  quiet: "quiet cafe"
};

const TAG_TO_CATEGORY: Record<PreferenceTag, string> = {
  coffee: "cafe",
  cocktails: "bar",
  vintage_shops: "store",
  dessert: "bakery",
  quiet: "cafe"
};

export class GoogleMapsAdapter {
  constructor(private readonly apiKey: string = process.env.GOOGLE_MAPS_API_KEY ?? "") {}

  async searchCandidates(
    center: Coordinates,
    tags: PreferenceTag[],
    radiusMeters: number
  ): Promise<RankingCandidate[]> {
    if (!this.apiKey) {
      return [];
    }

    const keyword = tags.map((tag) => TAG_TO_QUERY[tag]).join("|");
    const endpoint = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    endpoint.searchParams.set("location", `${center.lat},${center.lng}`);
    endpoint.searchParams.set("radius", String(radiusMeters));
    endpoint.searchParams.set("key", this.apiKey);
    if (keyword) {
      endpoint.searchParams.set("keyword", keyword);
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as PlaceSearchResponse;
    return (payload.results ?? [])
      .filter((item) => item.place_id && item.name && item.geometry?.location?.lat && item.geometry.location.lng)
      .slice(0, 20)
      .map((item) => {
        const category = item.types?.[0] ?? "place";
        const candidateTags = tags.filter((tag) => category.includes(TAG_TO_CATEGORY[tag]));

        return {
          venueId: item.place_id as string,
          name: item.name as string,
          lat: item.geometry?.location?.lat as number,
          lng: item.geometry?.location?.lng as number,
          category,
          openNow: item.opening_hours?.open_now ?? null,
          tags: candidateTags
        };
      });
  }

  async getTravelDurations(origins: Coordinates[], destinations: Coordinates[]): Promise<number[][]> {
    if (!this.apiKey || origins.length === 0 || destinations.length === 0) {
      return [];
    }

    const endpoint = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
    endpoint.searchParams.set(
      "origins",
      origins.map((origin) => `${origin.lat},${origin.lng}`).join("|")
    );
    endpoint.searchParams.set(
      "destinations",
      destinations.map((destination) => `${destination.lat},${destination.lng}`).join("|")
    );
    endpoint.searchParams.set("key", this.apiKey);
    endpoint.searchParams.set("mode", "driving");

    const response = await fetch(endpoint);
    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as DistanceMatrixResponse;
    return (payload.rows ?? []).map((row) =>
      (row.elements ?? []).map((element) => {
        if (element.status !== "OK" || typeof element.duration?.value !== "number") {
          return Number.POSITIVE_INFINITY;
        }
        return Math.round(element.duration.value / 60);
      })
    );
  }
}
