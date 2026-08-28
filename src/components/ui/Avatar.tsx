"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-amber-500",
];

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getColorFromId(idOrName: string): string {
  let hash = 0;
  const str = idOrName || "default";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

interface AvatarProps {
  src?: string | null;
  name: string;
  id?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { size: 24, text: "text-[10px]", rounded: "rounded-full" },
  md: { size: 40, text: "text-sm", rounded: "rounded-full" },
  lg: { size: 64, text: "text-xl", rounded: "rounded-full" },
};

export default function Avatar({
  src,
  name,
  id,
  size = "md",
  className,
}: AvatarProps) {
  const initials = getInitials(name);
  const color = getColorFromId(id || name);
  const { size: pxSize, text, rounded } = sizeMap[size];

  if (src) {
    return (
      <div className={cn("relative flex-shrink-0 overflow-hidden", sizeMap[size].rounded, className)} style={{ width: pxSize, height: pxSize }}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={`${pxSize}px`}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-white font-semibold flex-shrink-0 select-none",
        sizeMap[size].rounded,
        sizeMap[size].text,
        color,
        className
      )}
      style={{ width: pxSize, height: pxSize }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}
