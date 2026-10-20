import React from "react";

interface PatientAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PatientAvatar: React.FC<PatientAvatarProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  // Generate initials (e.g. "Ana Clara Silva" -> "AC", "Lucas Mendes" -> "LM")
  const words = name.trim().split(" ").filter(Boolean);
  const initials =
    words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : words[0]
        ? words[0].substring(0, 2).toUpperCase()
        : "PA";

  // Pastel color variants based on name hash
  const pastelColors = [
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-purple-100 text-purple-700 border-purple-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-teal-100 text-teal-700 border-teal-200",
  ];

  let charCodeSum = 0;
  for (let i = 0; i < name.length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  const colorClass = pastelColors[charCodeSum % pastelColors.length];

  const sizeClasses = {
    sm: "w-8 h-8 text-xs font-black",
    md: "w-10 h-10 text-sm font-black",
    lg: "w-12 h-12 text-base font-black",
  };

  return (
    <div
      className={`rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs select-none ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {initials}
    </div>
  );
};
