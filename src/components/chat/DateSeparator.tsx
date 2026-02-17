import React from "react";

interface DateSeparatorProps {
  date: string;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
        {date}
      </div>
    </div>
  );
}
