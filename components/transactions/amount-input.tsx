"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["000", "0", "⌫"],
];

function formatDisplay(raw: string): string {
  if (!raw) return "";
  const [integer, decimal] = raw.split(".");
  const formatted = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${formatted}.${decimal}` : formatted;
}

interface AmountInputProps {
  defaultValue?: number | string;
  required?: boolean;
  id?: string;
  name?: string;
  value?: number | string;
  onValueChange?: (value: string) => void;
}

function normalizeRaw(value: number | string | undefined) {
  return value != null && value !== "" ? String(value).replace(/,/g, "") : "";
}

export function AmountInput({
  defaultValue,
  required,
  id = "amount",
  name = "amount",
  value,
  onValueChange,
}: AmountInputProps) {
  const [internalRaw, setInternalRaw] = useState(normalizeRaw(defaultValue));
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const raw = isControlled ? normalizeRaw(value) : internalRaw;

  function updateRaw(nextRaw: string) {
    if (isControlled) {
      onValueChange?.(nextRaw);
      return;
    }
    setInternalRaw(nextRaw);
    onValueChange?.(nextRaw);
  }

  function handleKey(key: string) {
    if (key === "⌫") {
      updateRaw(raw.slice(0, -1));
    } else if (key === "000") {
      updateRaw(raw ? raw + "000" : "");
    } else if (key === ".") {
      updateRaw(raw.includes(".") ? raw : (raw || "0") + ".");
    } else {
      updateRaw(raw === "0" ? key : raw + key);
    }
  }

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef}>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="none"
        readOnly
        placeholder="0"
        value={formatDisplay(raw)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        required={required}
        className={cn(
          "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[16px] md:text-sm shadow-sm transition-shadow",
          "placeholder:text-muted-foreground cursor-pointer select-none",
          open ? "outline-none ring-1 ring-ring" : ""
        )}
      />

      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-200 border-t bg-background pb-safe">
          <div className="flex justify-end">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              className="flex h-12 w-16 items-center justify-center text-muted-foreground active:text-foreground"
            >
              <ChevronDown className="size-6" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-px bg-border">
            {KEYS.flat().map((key) => (
              <button
                key={key}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleKey(key);
                }}
                className={cn(
                  "flex h-14 items-center justify-center bg-background text-lg font-medium",
                  "transition-colors active:bg-muted",
                  key === "⌫" && "text-muted-foreground"
                )}
              >
                {key === "⌫" ? <Delete className="size-5" /> : key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
