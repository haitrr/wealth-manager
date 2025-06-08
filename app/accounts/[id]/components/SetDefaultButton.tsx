"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SetDefaultButtonProps {
  accountId: string;
  isDefault: boolean;
}

export function SetDefaultButton({ accountId, isDefault }: SetDefaultButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetDefault = async () => {
    if (isDefault) return; // Already default, no action needed

    setLoading(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ setAsDefault: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to set account as default");
      }

      // Refresh the page to show updated state
      router.refresh();
    } catch (error) {
      console.error("Error setting account as default:", error);
      alert("Failed to set account as default. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isDefault) {
    return (
      <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
        ✓ Default Account
      </span>
    );
  }

  return (
    <button
      onClick={handleSetDefault}
      disabled={loading}
      className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? "Setting..." : "Set as Default"}
    </button>
  );
}
