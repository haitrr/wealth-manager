import api from "@/lib/axios";

export interface OpenTimelinePlace {
  id: string;
  name: string;
}

export async function getVisitSuggestion(date: string): Promise<OpenTimelinePlace | null> {
  const { data } = await api.get<{ placeId: string; placeName: string } | null>(
    "/integrations/opentimeline/visits",
    { params: { at: date } }
  );
  if (!data) return null;
  return { id: data.placeId, name: data.placeName };
}

export async function searchPlaces(q: string): Promise<OpenTimelinePlace[]> {
  const { data } = await api.get<{ places: OpenTimelinePlace[] }>(
    "/integrations/opentimeline/places",
    { params: { q } }
  );
  return data.places;
}
