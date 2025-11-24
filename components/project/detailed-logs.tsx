"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2, Loader2, XCircle, Clock, ChevronRight, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface ProcessingLog {
  id: string
  step_name: string
  step_order: number
  status: "pending" | "processing" | "completed" | "failed"
  message: string
  details?: Record<string, any>
  started_at?: string
  completed_at?: string
  created_at: string
}

interface DetailedLogsProps {
  projectId: string
  autoRefresh?: boolean
}

export function DetailedLogs({ projectId, autoRefresh = true }: DetailedLogsProps) {
  const [logs, setLogs] = useState<ProcessingLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [projectStatus, setProjectStatus] = useState<string>("pending")

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/logs`)
      const data = await response.json()

      console.log("[v0] Logs fetched:", data)
      console.log("[v0] Number of logs:", data.logs?.length || 0)

      setLogs(data.logs || [])
      setProjectStatus(data.project?.status || "pending")
      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching logs:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()

    if (autoRefresh && projectStatus !== "completed" && projectStatus !== "failed") {
      const interval = setInterval(fetchLogs, 2000) // Refresh every 2 seconds
      return () => clearInterval(interval)
    }
  }, [projectId, autoRefresh, projectStatus])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case "pending":
        return <Clock className="h-4 w-4 text-muted-foreground" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400"
      case "failed":
        return "bg-destructive/10 text-destructive"
      case "processing":
        return "bg-primary/10 text-primary"
      case "pending":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando logs...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Logs Detalhados do Processamento</span>
          {autoRefresh && projectStatus !== "completed" && projectStatus !== "failed" && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Atualizando...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">Nenhum log disponível ainda</p>
              <p className="text-xs text-muted-foreground">Os logs aparecerão assim que o processamento iniciar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={`${log.step_order}-${index}`}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    log.status === "processing" ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{log.step_name}</span>
                      <Badge variant="secondary" className={`text-xs ${getStatusColor(log.status)}`}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.message}</p>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <div className="text-xs space-y-1">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium text-foreground">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {log.completed_at && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Concluído em {new Date(log.completed_at).toLocaleTimeString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
