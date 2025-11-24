"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2, Trash2 } from "lucide-react"
import type { Project } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { deleteProject } from "@/lib/api-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectHeaderProps {
  project: Project
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
      label: "Pendente",
    },
    processing: {
      icon: Loader2,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-500",
      label: "Processando",
    },
    completed: {
      icon: CheckCircle2,
      color: "bg-green-500/10 text-green-600 dark:text-green-500",
      label: "Concluído",
    },
    failed: {
      icon: AlertCircle,
      color: "bg-red-500/10 text-red-600 dark:text-red-500",
      label: "Falhou",
    },
  }

  const config = statusConfig[project.status]
  const StatusIcon = config.icon

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProject(project.id)
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] Error deleting project:", error)
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              {project.thumbnail_url && (
                <img
                  src={project.thumbnail_url || "/placeholder.svg"}
                  alt={project.title || "Video thumbnail"}
                  className="h-32 w-48 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-balance text-2xl font-bold text-foreground">
                  {project.title || "Projeto Sem Título"}
                </h1>
                {project.description && <p className="mt-2 text-pretty text-muted-foreground">{project.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Badge className={config.color} variant="secondary">
                    <StatusIcon
                      className={`mr-1.5 h-3.5 w-3.5 ${project.status === "processing" ? "animate-spin" : ""}`}
                    />
                    {config.label}
                  </Badge>
                  {project.duration && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  <Button variant="ghost" size="sm" asChild>
                    <a href={project.youtube_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-4 w-4" />
                      Ver Original
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este projeto? Isso também excluirá todos os clips gerados. Esta ação
                    não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
