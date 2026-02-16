"use client";

import React from "react";
import CreateProjectForm from "@/components/projects/CreateProjectForm";

export default function CreateProjectPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-2xl font-bold text-white mb-1">
          Create New Project
        </h1>
        <p className="text-[#A1A1AA] text-sm">
          Fill in the details to create your project
        </p>
      </div>

      {/* Form */}
      <CreateProjectForm />
    </div>
  );
}
