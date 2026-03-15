"use client";

import { useState, useRef, useEffect } from "react";
import { Delete } from "lucide-react";
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
}

export function AmountInput({ defaultValue, required }: AmountInputProps) {
  const initialRaw = defaultValue != null && defaultValue !== "" ? String(defaultValue) : "";
  const [raw, setRaw] = useState(initialRaw);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleKey(key: string) {
    if (key === "⌫") {
      setRaw((prev) => prev.slice(0, -1));
    } else if (key === "000") {
      setRaw((prev) => (prev ? prev + "000" : ""));
    } else if (key === ".") {
      setRaw((prev) => (prev.includes(".") ? prev : (prev || "0") + "."));
    } else {
      setRaw((prev) => {
        if (prev === "0") return key;
        return prev + key;
      });
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
        id="amount"
        name="amount"
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
