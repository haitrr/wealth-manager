import api from "@/lib/axios";

export interface OpenTimelinePlace {
  id: string;
  name: string;
}

export async function getVisitSuggestions(date: string): Promise<OpenTimelinePlace[]> {
  const { data } = await api.get<{ places: OpenTimelinePlace[] }>(
    "/integrations/opentimeline/visits",
    { params: { at: date } }
  );
  return data.places;
}

export async function searchPlaces(q: string): Promise<OpenTimelinePlace[]> {
  const { data } = await api.get<{ places: OpenTimelinePlace[] }>(
    "/integrations/opentimeline/places",
    { params: { q } }
  );
  return data.places;
}
