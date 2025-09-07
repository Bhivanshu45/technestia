import React from "react";

interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  techStack?: string[];
  status?: string;
  onClick?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  coverImage,
  techStack,
  status,
  onClick,
}) => {
  return (
    <div
      className="bg-[#232326] border border-zinc-800 rounded-2xl shadow-lg p-0 cursor-pointer hover:shadow-2xl hover:border-blue-600 transition-all duration-200 flex flex-col group hover:-translate-y-1"
      onClick={onClick}
      tabIndex={0}
      aria-label={`View project ${name}`}
    >
      <div className="w-full h-40 bg-[#18181b] rounded-t-2xl flex items-center justify-center overflow-hidden relative">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mb-1 opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 15l-5-5a2 2 0 00-2.828 0l-7 7"
              />
              <circle cx="8.5" cy="8.5" r="1.5" />
            </svg>
            <span className="text-xs">No Image</span>
          </div>
        )}
        {status && (
          <span className="absolute top-3 right-3 bg-blue-900 text-blue-300 border border-blue-700 text-xs px-3 py-1 rounded-full font-semibold shadow">
            {status}
          </span>
        )}
      </div>
      <div className="flex-1 flex flex-col px-5 py-4">
        <h3
          className="text-xl font-bold text-white truncate group-hover:text-blue-400 transition-colors flex-1 mb-1"
          title={name}
        >
          {name}
        </h3>
        <div className="h-[1.5px] w-10 bg-blue-700 rounded-full mb-2 opacity-70 group-hover:w-16 transition-all"></div>
        <p className="text-sm text-[#A1A1AA] line-clamp-2 mb-3 min-h-[2.5em]">
          {description}
        </p>
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="bg-[#18181b] border border-zinc-700 text-xs px-2 py-0.5 rounded text-white font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
