import React from "react";

interface ProjectMetaSectionProps {
  uploadedAt?: string;
  lastUpdatedAt?: string;
}

const ProjectMetaSection: React.FC<ProjectMetaSectionProps> = ({ uploadedAt, lastUpdatedAt }) => {
  return (
    <section className="w-full flex flex-col items-center justify-center pb-10 px-4">
      <div className="w-full max-w-6xl">
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400 font-medium">Created</span>
            <span className="text-sm text-white font-semibold">
              {uploadedAt ? new Date(uploadedAt).toLocaleString() : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400 font-medium">Last Updated</span>
            <span className="text-sm text-white font-semibold">
              {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "-"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectMetaSection;
