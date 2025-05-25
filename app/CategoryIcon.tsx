"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

type Props = {
  icon: String;
}

export function CategoryIcon({icon}: Props) {
  const [iconSrc, setIconSrc] = useState<string>(`/icons/${icon}.svg`);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    setIconSrc(`/icons/${icon}.svg`);
    setError(false);
  }, [icon]);

  const handleError = () => {
    if (!error) {
      setIconSrc("/icons/money.svg");
      setError(true);
    }
  };

  return (
    <div className="w-6 h-6 flex items-center justify-center">
      <Image 
        src={iconSrc}
        width={24}
        height={24}
        alt={`${icon} icon`}
        onError={handleError}
      />
    </div>
  );
}
