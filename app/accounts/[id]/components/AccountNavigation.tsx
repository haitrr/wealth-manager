import Link from "next/link";

export function AccountNavigation() {
  return (
    <Link 
      href="/accounts" 
      className="text-primary hover:text-primary/80 flex items-center gap-1 mb-4"
    >
      ← Back to Accounts
    </Link>
  );
}