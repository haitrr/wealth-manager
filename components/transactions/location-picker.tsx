"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVisitSuggestion, searchPlaces, OpenTimelinePlace } from "@/lib/api/opentimeline";
import { getSettings } from "@/lib/api/settings";

interface LocationPickerProps {
  date: string;
  value: OpenTimelinePlace | null;
  onChange: (value: OpenTimelinePlace | null) => void;
}

export function LocationPicker({ date, value, onChange }: LocationPickerProps) {
  // All hooks must be called unconditionally before any early return
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [dismissed, setDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const prevDateRef = useRef(date);

  const configured = !!settings?.openTimelineUrl;

  // Reset dismissed state when date changes
  useEffect(() => {
    if (prevDateRef.current !== date) {
      prevDateRef.current = date;
      setDismissed(false);
      setSearchQuery("");
    }
  }, [date]);

  const { data: suggestion, isLoading: isSuggesting } = useQuery({
    queryKey: ["opentimeline-visit", date],
    queryFn: () => getVisitSuggestion(date),
    enabled: configured && !!date && !value && !dismissed,
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
            onClick={() => { onChange(null); setDismissed(false); }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Clear location"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Auto-suggestion available
  if (!dismissed && suggestion) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
          <MapPin className="size-4 text-primary shrink-0" />
          <span className="flex-1 truncate text-foreground">{suggestion.name}</span>
          <button
            type="button"
            onClick={() => onChange(suggestion)}
            className="text-xs font-medium text-primary hover:text-primary/80 shrink-0"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss suggestion"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  // Suggestion loading
  if (!dismissed && isSuggesting) {
    return (
      <div className="space-y-2">
        <Label>Location (optional)</Label>
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground animate-pulse">
          <MapPin className="size-4 shrink-0" />
          <span>Looking up location…</span>
        </div>
      </div>
    );
  }

  // Manual search
  return (
    <div className="space-y-2">
      <Label>Location (optional)</Label>
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
