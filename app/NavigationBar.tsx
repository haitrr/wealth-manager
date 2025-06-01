"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  {label: "Home", href: "/", pattern: /^\/$/,  icon: "🏠"},
  {label: "Budgets", href: "/budgets", pattern: /^\/budgets.*/, icon: "📊"},
  {label: "Accounts", href: "/accounts", pattern: /^\/loan.*/, icon: "💳"},
  {label: "Settings", href: "/settings", pattern: /^\/settings.*/, icon: "⚙️"},
];

type Props = {
  item: {
    label: string;
    href: string;
    pattern: RegExp;
    icon: string;
  };
};

function MenuItem({item}: Props) {
  const pathName = usePathname();
  const isActive = pathName.match(item.pattern);
  return (
    <Link 
      href={item.href} 
      className={`transition-all duration-300 px-4 py-2 rounded-lg flex flex-col items-center relative ${
        isActive 
          ? "text-blue-600 font-medium" 
          : "text-gray-500 hover:text-blue-500"
      }`}
    >
      <span className="text-xl">{item.icon}</span>
      <span className="text-xs mt-1">{item.label}</span>
      {isActive && <span className="absolute -bottom-0.5 w-1/2 h-1 bg-blue-500 rounded-full"></span>}
    </Link>
  );
}

export function NavigationBar() {
  return (
    <nav className="flex justify-center p-1 border-t border-secondary bg-secondary backdrop-blur-md shadow-sm">
      <div className="container flex items-center justify-between max-w-5xl px-2">
        <div className="flex items-center justify-between w-full">
          {menuItems.map((item) => (
            <MenuItem key={item.href} item={item} />
          ))}
        </div>
      </div>
    </nav>
  );
}
