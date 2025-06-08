"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Category } from "@prisma/client";
import { useState, useMemo } from "react";

type Props = {
  categories: Category[];
  className?: string;
  value?: string;
  onChange: (value: string) => void;
};

const CategorySelect = ({
  categories,
  className,
  value,
  onChange,
  ...props
}: Props) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  return (
    <Select {...props} value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            autoFocus={false}
          />
        </div>
        {filteredCategories.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            No categories found
          </div>
        ) : (
          filteredCategories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default CategorySelect;
