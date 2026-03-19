"use client";

import { useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TransactionSearchProps {
  onSearch: (query: string) => void;
}

export function TransactionSearch({ onSearch }: TransactionSearchProps) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setValue(v);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(v.trim()), 300);
  }

  function clear() {
    setValue("");
    clearTimeout(timerRef.current);
    onSearch("");
  }

  return (
    <div className="relative mt-3">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search all transactions…"
        value={value}
        onChange={handleChange}
        className="pl-9 pr-9 text-[16px] md:text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
