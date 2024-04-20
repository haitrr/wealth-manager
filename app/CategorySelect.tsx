"use client";

import {Category} from "@/utils/types";

type Props = {
  categories: Category[];
  name: string;
};

const CategorySelect = ({categories, name}: Props) => {
  return (
    <select name={name} className="text-slate-950">
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
