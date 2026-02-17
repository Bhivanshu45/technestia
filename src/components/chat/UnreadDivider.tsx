import React from "react";

interface UnreadDividerProps {
  count: number;
}

export default function UnreadDivider({ count }: UnreadDividerProps) {
  return (
    <div className="flex items-center py-4">
      <div className="flex-1 border-t border-red-600/50" />
      <span className="px-3 text-xs font-medium text-red-500">
        {count} unread message{count !== 1 ? "s" : ""}
      </span>
      <div className="flex-1 border-t border-red-600/50" />
    </div>
  );
}
