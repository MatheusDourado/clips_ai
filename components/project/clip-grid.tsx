"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Edit2, Loader2, Play, Trash2 } from "lucide-react"
import type { Clip } from "@/lib/types"
import { useState } from "react"
import { deleteClip } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { EditClipDialog } from "./edit-clip-dialog"
import { AIMetadataButton } from "./ai-metadata-button"

interface ClipGridProps {
  clips: Clip[]
  projectId: string
}

export function ClipGrid({ clips, projectId }: ClipGridProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDelete = async (clipId: string) => {
    setDeletingId(clipId)
    try {
      await deleteClip(clipId)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting clip:", error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (clip: Clip) => {
    setDownloadingId(clip.id)
    try {
      console.log("[v0] Downloading clip:", clip.id)
      const response = await fetch(`/api/clips/download/${clip.id}`)
      const data = await response.json()

      if (data.success) {
        alert(
          `Clip pronto para download!\n\nTítulo: ${data.clipInfo.title}\nDuração: ${data.clipInfo.duration}s\nFormato: ${data.clipInfo.format}`,
        )
      }
    } catch (error) {
      console.error("[v0] Error downloading clip:", error)
      alert("Erro ao baixar clip. Tente novamente.")
    } finally {
      setDownloadingId(null)
    }
  }

  const formatDuration = (start: number, end: number) => {
    const duration = end - start
    const minutes = Math.floor(duration / 60)
    const seconds = Math.floor(duration % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (clips.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Play className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Nenhum clip ainda</h3>
          <p className="text-center text-sm text-muted-foreground">
            Aguarde o processamento terminar ou crie um clip personalizado
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {clips.map((clip) => (
        <Card key={clip.id} className="overflow-hidden">
          <div className="aspect-video w-full bg-muted relative">
            {clip.thumbnail_url ? (
              <img
                src={clip.thumbnail_url || "/placeholder.svg"}
                alt={clip.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Play className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2">
              <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/70">
                {formatDuration(clip.start_time, clip.end_time)}
              </Badge>
              <Badge variant="secondary" className="bg-black/70 text-white hover:bg-black/70">
                {clip.format}
              </Badge>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-balance font-semibold text-foreground">{clip.title}</h3>
                <Badge
                  variant={
                    clip.status === "completed" ? "default" : clip.status === "failed" ? "destructive" : "secondary"
                  }
                  className="shrink-0"
                >
                  {clip.status === "processing" && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  {clip.status === "completed" ? "Concluído" : clip.status === "failed" ? "Falhou" : "Processando"}
                </Badge>
              </div>
              {clip.description && (
                <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">{clip.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(clip)}
                  disabled={clip.status !== "completed" || downloadingId === clip.id}
                >
                  {downloadingId === clip.id ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1.5 h-4 w-4" />
                  )}
                  Baixar
                </Button>
                <EditClipDialog clip={clip} projectId={projectId}>
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </EditClipDialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(clip.id)}
                  disabled={deletingId === clip.id}
                >
                  {deletingId === clip.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <AIMetadataButton clipId={clip.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
