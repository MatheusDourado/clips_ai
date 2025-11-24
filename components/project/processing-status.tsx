"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react"
import type { Project } from "@/lib/types"
import { useEffect, useState } from "react"

interface ProcessingStatusProps {
  project: Project
}

export function ProcessingStatus({ project: initialProject }: ProcessingStatusProps) {
  const [project, setProject] = useState(initialProject)
  const [isPolling, setIsPolling] = useState(
    initialProject.status !== "completed" && initialProject.status !== "failed",
  )

  useEffect(() => {
    if (!isPolling) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}/status`)
        const data = await response.json()

        setProject((prev) => ({
          ...prev,
          status: data.status,
          progress: data.progress,
          current_step: data.current_step,
        }))

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false)
          window.location.reload() // Reload to show clips
        }
      } catch (error) {
        console.error("[v0] Error polling status:", error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [isPolling, project.id])

  const getStatusIcon = () => {
    switch (project.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "pending":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />
    }
  }

  const getStatusMessage = () => {
    if (project.current_step) {
      return project.current_step
    }

    switch (project.status) {
      case "pending":
        return "Aguardando processamento..."
      case "downloading":
        return "Baixando vídeo do YouTube..."
      case "transcribing":
        return "Transcrevendo áudio com IA..."
      case "analyzing":
        return "Analisando conteúdo e identificando melhores momentos..."
      case "processing":
        return "Processando clips..."
      case "completed":
        return "Processamento concluído!"
      case "failed":
        return "Falha no processamento"
      default:
        return "Processando..."
    }
  }

  if (project.status === "completed") {
    return null // Don't show status card when completed
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5">{getStatusIcon()}</div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Processando Vídeo</h3>
                <p className="mt-1 text-sm text-muted-foreground">{getStatusMessage()}</p>
              </div>
              <Badge
                variant={
                  project.status === "completed" ? "default" : project.status === "failed" ? "destructive" : "secondary"
                }
              >
                {project.status}
              </Badge>
            </div>
            {project.status !== "pending" && project.status !== "failed" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{project.progress || 0}%</span>
                </div>
                <Progress value={project.progress || 0} className="h-2" />
              </div>
            )}
            {project.status === "processing" && (
              <div className="rounded-md bg-primary/10 p-3">
                <p className="text-sm text-foreground">
                  {project.progress && project.progress > 70
                    ? "Quase lá! Gerando os clips finais... 🎬"
                    : "A IA está trabalhando na análise do seu conteúdo! 🚀"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
