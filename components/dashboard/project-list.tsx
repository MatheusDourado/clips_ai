import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ExternalLink, Video } from "lucide-react"
import Link from "next/link"
import type { Project } from "@/lib/types"

interface ProjectListProps {
  projects: Project[]
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum projeto ainda</h3>
          <p className="text-center text-sm text-muted-foreground">
            Crie seu primeiro projeto adicionando uma URL do YouTube
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="overflow-hidden">
          <div className="aspect-video w-full bg-muted">
            {project.thumbnail_url ? (
              <img
                src={project.thumbnail_url || "/placeholder.svg"}
                alt={project.title || "Video thumbnail"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="line-clamp-2 text-balance text-base">
                {project.title || "Projeto Sem Título"}
              </CardTitle>
              <Badge
                variant={
                  project.status === "completed" ? "default" : project.status === "failed" ? "destructive" : "secondary"
                }
              >
                {project.status === "completed"
                  ? "Concluído"
                  : project.status === "failed"
                    ? "Falhou"
                    : project.status === "processing"
                      ? "Processando"
                      : "Pendente"}
              </Badge>
            </div>
            {project.description && (
              <CardDescription className="line-clamp-2 text-pretty">{project.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {project.duration
                  ? `${Math.floor(project.duration / 60)}:${(project.duration % 60).toString().padStart(2, "0")}`
                  : "Processando..."}
              </span>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link href={`/dashboard/project/${project.id}`}>Ver Clips</Link>
              </Button>
              <Button variant="outline" size="icon" asChild>
                <a href={project.youtube_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
