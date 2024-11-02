"use client";

import * as React from "react";
import {format} from "date-fns";
import {Calendar as CalendarIcon} from "lucide-react";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

type Props = {
  name?: string;
  value?: Date;
  onChange: (value: Date) => void;
};

export function DatePicker({name, onChange, value, ...props}: Props) {
  const onSelected = (date: Date | undefined) => {
    if (date) {
      onChange(date);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" onSelect={onSelected} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
