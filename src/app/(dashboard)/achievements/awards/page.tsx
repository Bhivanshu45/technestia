"use client";

import React from "react";
import EmptyState from "@/components/common/EmptyState";
import { Award } from "lucide-react";

export default function AwardsPage() {
  return (
    <div className="p-6">
      <EmptyState
        icon={Award}
        title="Project awards coming soon"
        description="This section will be available once awards are enabled on the backend."
      />
    </div>
  );
}
