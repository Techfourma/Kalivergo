"use client";

import { useState } from "react";
import Card from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import { FolderKanban, ExternalLink, Github, Search } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface Project {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  imageUrl?: string | null;
  githubUrl?: string | null;
  liveUrl?: string | null;
  memberName: string;
  memberRole: string;
}

interface ProjectShowcaseProps {
  projects: Project[];
}

export default function ProjectShowcase({ projects }: ProjectShowcaseProps) {
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  const allTech = Array.from(
    new Set(projects.flatMap((p) => p.techStack))
  ).sort();

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.memberName.toLowerCase().includes(search.toLowerCase());
    const matchTech = !selectedTech || p.techStack.includes(selectedTech);
    return matchSearch && matchTech;
  });

  return (
    <div className="space-y-6">
 
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Project Showcase</h1>
            <p className="text-sm text-white">
              {projects.length} project dari anggota kelas
            </p>
          </div>
        </div>
      </div>

      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-dark-400" />
          <input
            type="text"
            placeholder="Cari project atau anggota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-dark-200 bg-white py-2.5 pl-10 pr-4 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTech(null)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              !selectedTech
                ? "bg-primary-600 text-white"
                : "bg-dark-100 text-dark-600 hover:bg-dark-200"
            )}
          >
            All
          </button>
          {allTech.map((tech) => (
            <button
              key={tech}
              onClick={() =>
                setSelectedTech(selectedTech === tech ? null : tech)
              }
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                selectedTech === tech
                  ? "bg-primary-600 text-white"
                  : "bg-dark-100 text-dark-600 hover:bg-dark-200"
              )}
            >
              {tech}
            </button>
          ))}
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-dark-400">
            <FolderKanban className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Tidak ada project ditemukan</p>
          </div>
        ) : (
          filtered.map((project) => (
            <Card key={project.id} hover className="overflow-hidden !p-0">

              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FolderKanban className="h-16 w-16 text-primary-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-lg font-bold text-white line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-white/80 mt-1">
                    by {project.memberName}
                  </p>
                </div>
              </div>

              <div className="p-5">
                <p className="text-sm text-dark-600 line-clamp-3 mb-4">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="info">
                      {tech}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-dark-100 px-3 py-1.5 text-xs font-medium text-dark-700 hover:bg-dark-200 transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" />
                      Code
                    </a>
                  )}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-primary-100 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-200 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Live
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}