"use client";
import {usePathname} from "next/navigation";

const menuItems = [
  {label: "Home", href: "/", pattern: /^\/$/},
  {label: "Budgets", href: "/budgets", pattern: /^\/budgets.*/},
  {label: "Loans", href: "/debt-loan", pattern: /^\/debt-loan.*/},
  {label: "Settings", href: "/settings", pattern: /^\/settings.*/},
];

type Props = {
  item: {
    label: string;
    href: string;
    pattern: RegExp;
  };
};

function MenuItem({item}: Props) {
  const pathName = usePathname();
  const isActive = pathName.match(item.pattern);
  const textColor = isActive ? "text-blue-500" : "text-gray-500";
  return (
    <div className={`${textColor}`}>
      <a href={item.href}>{item.label}</a>
    </div>
  );
}

export function NavigationBar() {
  return (
    <div className="flex justify-between p-4 text-xl bg-secondary">
      {menuItems.map((item) => {
        return <MenuItem key={item.href} item={item} />;
      })}
    </div>
  );
}
