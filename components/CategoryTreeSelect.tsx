"use client";

import {Category} from "@/utils/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useEffect, useMemo, useState} from "react";
import {getCategories} from "@/actions/category";
import {TreeSelect} from "antd";

type Props = {
  className?: string;
  value?: string;
  onChange: (value: string) => void;
};

const CategoryTreeSelect = ({className, ...props}: Props) => {
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof getCategories>>
  >([]);
  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data);
    });
  }, []);
  const treeDate = useMemo(
    () =>
      categories.map((category) => {
        let data: any = {
          value: category.id,
          title: category.name,
          children: [],
        };
        if (category.parentId === null) {
          data = {
            ...data,
            children: categories.filter((c) => c.parentId === category.id),
          };
        }
        return data;
      }),
    [categories],
  );
  return (
    <TreeSelect style={{width: 300}} multiple treeData={treeDate} {...props} />
  );
};

export default CategoryTreeSelect;
