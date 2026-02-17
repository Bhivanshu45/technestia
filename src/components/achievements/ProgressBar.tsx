import React from "react";

export default function ProgressBar({
  value,
  max,
}: {
  value: number;
  max: number;
}) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-[#18181b] rounded-full overflow-hidden border border-zinc-800">
        <div
          className="h-full bg-blue-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-[#A1A1AA] mt-2">{percentage}% complete</div>
    </div>
  );
}
