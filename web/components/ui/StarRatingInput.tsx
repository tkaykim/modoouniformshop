"use client";
import { useState } from "react";

type Props = {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md" | "lg";
};

export function StarRatingInput({ value, onChange, size = "md" }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const font = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={`inline-flex items-center gap-1 ${font}`}>
      {stars.map((n) => {
        const active = (hover ?? value) >= n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star`}
            className={`transition-transform ${active ? "text-yellow-500" : "text-gray-300"} hover:scale-110`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(n)}
          >
            {active ? "★" : "☆"}
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">{value}/5</span>
    </div>
  );
}

