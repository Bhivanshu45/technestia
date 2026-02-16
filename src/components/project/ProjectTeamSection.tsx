import React from "react";

interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
}

interface ProjectTeamSectionProps {
  creator: User;
  collaborators: User[];
}

const ProjectTeamSection: React.FC<ProjectTeamSectionProps> = ({ creator, collaborators }) => {
  return (
    <section className="w-full flex flex-col items-center justify-center pb-10 px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
          <div className="text-xs text-zinc-400 font-medium tracking-wide">Created by</div>
          <div className="flex items-center gap-4">
            <img
              src={creator.image || "/default-avatar.png"}
              alt={creator.name}
              className="w-12 h-12 rounded-full border-2 border-blue-500/70 shadow"
            />
            <div>
              <div className="text-base font-semibold text-white leading-tight">{creator.name}</div>
              <div className="text-xs text-blue-400 font-mono">@{creator.username}</div>
            </div>
          </div>
        </div>
        {/* Collaborators Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-3 shadow-sm w-full">
          <div className="text-xs text-zinc-400 font-medium tracking-wide">
            Collaborators ({collaborators.length})
          </div>
          <div className="flex flex-wrap gap-3 w-full">
            {collaborators.length === 0 && (
              <span className="text-xs text-zinc-500">No collaborators yet.</span>
            )}
            {collaborators.slice(0, 4).map((user) => (
              <div key={user.id} className="flex items-center gap-2 bg-zinc-950/70 border border-zinc-800 px-3 py-2 rounded-lg shadow-sm flex-1 min-w-[180px]">
                <img
                  src={user.image || "/default-avatar.png"}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-zinc-700"
                />
                <div className="flex flex-col w-full">
                  <span className="text-xs text-white font-semibold leading-tight truncate">{user.name}</span>
                  <span className="text-[10px] text-blue-400 font-mono truncate">@{user.username}</span>
                </div>
              </div>
            ))}
            {collaborators.length > 4 && (
              <span className="text-xs text-zinc-500">+{collaborators.length - 4} more...</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectTeamSection;
