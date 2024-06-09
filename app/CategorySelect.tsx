"use client";

import {Category} from "@/utils/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  categories: Category[];
  name: string;
  className?: string;
};

const CategorySelect = ({categories, name, className}: Props) => {
  return (
    <Select name={name}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CategorySelect;
