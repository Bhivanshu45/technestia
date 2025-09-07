import React from "react";
import ProjectCard from "./ProjectCard";

// Props for ProjectList (customize as needed)
interface ProjectListProps {
  projects: Array<{
    id: string;
    name: string;
    description: string;
    coverImage?: string;
    techStack?: string[];
    status?: string;
  }>;
  onProjectClick?: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onProjectClick,
}) => {
  if (!projects.length) {
    return (
      <div className="text-center text-zinc-500 py-8">No projects found.</div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          description={project.description}
          coverImage={project.coverImage}
          techStack={project.techStack}
          status={project.status}
          onClick={
            onProjectClick ? () => onProjectClick(project.id) : undefined
          }
        />
      ))}
    </div>
  );
};

export default ProjectList;
