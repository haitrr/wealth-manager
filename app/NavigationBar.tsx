"use client";
import {usePathname} from "next/navigation";

const menuItems = [
  {label: "Home", href: "/"},
  {label: "Budgets", href: "/budgets"},
  {label: "Settings", href: "/settings"},
];

type Props = {
  item: {
    label: string;
    href: string;
  };
};

function MenuItem({item}: Props) {
  const pathName = usePathname();
  const isActive = pathName === item.href;
  const textColor = isActive ? "text-blue-500" : "text-gray-500";
  console.log(item, textColor);
  return (
    <div className={`${textColor}`}>
      <a href={item.href}>{item.label}</a>
    </div>
  );
}

export function NavigationBar() {
  return (
    <div className="flex sticky bottom-0 justify-between p-2 bg-gray-900 text-white">
      {menuItems.map((item) => {
        return <MenuItem key={item.href} item={item} />;
      })}
    </div>
  );
}
