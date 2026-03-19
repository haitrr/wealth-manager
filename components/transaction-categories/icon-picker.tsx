"use client";

import { useState, useRef } from "react";
import { Search, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ICONS, ICON_GROUPS, CategoryIcon } from "./category-icon";
import { cn } from "@/lib/utils";

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClick}>
      <Upload className="size-4 mr-2" />
      Upload custom image
    </Button>
  );
}

interface IconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allKeys = Object.keys(ICONS);
  const filteredGroups = search.trim()
    ? [{
        label: "Results",
        keys: allKeys.filter((k) =>
          k.toLowerCase().includes(search.toLowerCase()) ||
          ICONS[k].label.toLowerCase().includes(search.toLowerCase())
        ),
      }]
    : ICON_GROUPS;

  function handleSelect(key: string) {
    onChange(key);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target?.result as string);
      setOpen(false);
      setSearch("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Choose icon"
        className={cn(
          "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-transparent shadow-sm transition-colors hover:bg-accent",
        )}
      >
        <CategoryIcon icon={value} size={22} />
        {value && (
          <span
            onClick={handleClear}
            className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-input bg-background text-muted-foreground hover:text-foreground"
          >
            <X className="size-2.5" />
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Icon</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-input px-3 py-1.5">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons…"
                className="flex-1 bg-transparent text-[16px] md:text-sm outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  <X className="size-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {filteredGroups.map((group) =>
                group.keys.length > 0 ? (
                  <div key={group.label}>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.keys.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelect(key)}
                          title={ICONS[key]?.label ?? key}
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors",
                            value === key
                              ? "border-primary ring-2 ring-primary ring-offset-1"
                              : "border-input hover:bg-accent"
                          )}
                        >
                          <CategoryIcon icon={key} size={26} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
              {filteredGroups.every((g) => g.keys.length === 0) && (
                <p className="py-4 text-center text-sm text-muted-foreground">No icons found</p>
              )}
            </div>

            <div className="border-t pt-3">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              <UploadButton onClick={() => fileInputRef.current?.click()} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
