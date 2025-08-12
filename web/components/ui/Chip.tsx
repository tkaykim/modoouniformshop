"use client";
import { PropsWithChildren } from "react";

type ChipProps = PropsWithChildren<{
  selected?: boolean;
  onClick?: () => void;
}>;

export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full border transition-colors",
        "bg-white text-gray-900 border-gray-200 hover:bg-gray-50",
        selected ? "ring-2 ring-yellow-300 shadow-sm" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

