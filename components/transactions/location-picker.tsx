"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVisitSuggestions, searchPlaces, OpenTimelinePlace } from "@/lib/api/opentimeline";
import { getSettings } from "@/lib/api/settings";

interface LocationPickerProps {
  date: string;
  value: OpenTimelinePlace | null;
  onChange: (value: OpenTimelinePlace | null) => void;
}

export function LocationPicker({ date, value, onChange }: LocationPickerProps) {
  // All hooks must be called unconditionally before any early return
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const prevDateRef = useRef(date);

  const configured = !!settings?.openTimelineUrl;

  // Clear the manual search when the date changes
  useEffect(() => {
    if (prevDateRef.current !== date) {
      prevDateRef.current = date;
      setSearchQuery("");
    }
  }, [date]);

  const { data: suggestions = [], isLoading: isSuggesting } = useQuery({
    queryKey: ["opentimeline-visit", date],
    queryFn: () => getVisitSuggestions(date),
    enabled: configured && !!date && !value,
    retry: false,
    staleTime: 60_000,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["opentimeline-places", searchQuery],
    queryFn: () => searchPlaces(searchQuery),
    enabled: configured && searchQuery.length >= 2,
    retry: false,
    staleTime: 30_000,
  });

  // Hidden entirely when OpenTimeline is not configured
  if (!configured) return null;

  // Confirmed value — show with clear button
  if (value) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
          <MapPin className="size-4 text-muted-foreground shrink-0" />
          <span className="flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear location"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // No value yet — show the day's visited places as pills, plus manual search
  return (
    <div className="space-y-2">
      <Label>Location (optional)</Label>

      {isSuggesting ? (
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          <MapPin className="size-4 shrink-0" />
          <span>Looking up places…</span>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => onChange(place)}
              className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm text-foreground hover:bg-primary/10 transition-colors max-w-full"
            >
              <MapPin className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{place.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <div className="flex items-center rounded-md border border-input bg-background px-3 gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            type="text"
            placeholder="Search location…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="border-0 shadow-none px-0 text-[16px] md:text-sm focus-visible:ring-0"
          />
        </div>
        {showDropdown && searchResults.length > 0 && (
          <ul className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md overflow-hidden">
            {searchResults.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onMouseDown={() => { onChange(place); setSearchQuery(""); setShowDropdown(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                >
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  {place.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
