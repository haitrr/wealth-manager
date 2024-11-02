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
  return (
    <Select {...props} value={value} onValueChange={onChange}>
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
