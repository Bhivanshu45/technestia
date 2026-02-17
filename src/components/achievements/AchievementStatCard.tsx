import React from "react";

export default function AchievementStatCard({
  label,
  value,
  subLabel,
  icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
  accent?: "blue" | "green" | "purple" | "yellow";
}) {
  const accentStyles = {
    blue: "bg-blue-900/30 text-blue-200",
    green: "bg-green-900/30 text-green-200",
    purple: "bg-purple-900/30 text-purple-200",
    yellow: "bg-yellow-900/30 text-yellow-200",
  }[accent];

  return (
    <div className="bg-[#232326] border border-zinc-800 rounded-lg p-4 flex gap-3">
      {icon && (
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accentStyles}`}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-[#A1A1AA]">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {subLabel && (
          <p className="text-xs text-[#A1A1AA] mt-1">{subLabel}</p>
        )}
      </div>
    </div>
  );
}
