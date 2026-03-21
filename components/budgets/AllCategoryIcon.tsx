"use client";
export function AllCategoryIcon({ size }: { size: number; }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* background */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#6366F1" />
      {/* top-left: shopping bag */}
      <rect x="6" y="10" width="8" height="7" rx="1.5" fill="#A5B4FC" />
      <path d="M8 10 Q8 7.5 10 7.5 Q12 7.5 12 10" stroke="#C7D2FE" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* top-right: food fork+knife */}
      <line x1="20" y1="7.5" x2="20" y2="17.5" stroke="#FDE68A" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="23" y1="7.5" x2="23" y2="11" stroke="#FDE68A" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M18 7.5 Q18 11 21.5 11" stroke="#FDE68A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* bottom-left: car */}
      <rect x="5" y="21" width="10" height="5" rx="1.5" fill="#6EE7B7" />
      <path d="M6 21 L7.5 18.5 H12.5 L14 21" fill="#6EE7B7" />
      <circle cx="7.5" cy="26" r="1.2" fill="#059669" />
      <circle cx="12.5" cy="26" r="1.2" fill="#059669" />
      {/* bottom-right: heart */}
      <path d="M26 21 C26 19.5 24 18 22.5 20 C21 18 19 19.5 19 21 C19 23.5 22.5 26 22.5 26 C22.5 26 26 23.5 26 21Z" fill="#FCA5A5" />
    </svg>
  );
}
