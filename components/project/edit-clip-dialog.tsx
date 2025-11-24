"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { updateClip } from "@/lib/api-client"
import type { Clip } from "@/lib/types"

interface EditClipDialogProps {
  clip: Clip
  projectId: string
  children: ReactNode
}

export function EditClipDialog({ clip, projectId, children }: EditClipDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: clip.title,
    description: clip.description || "",
    startTime: clip.start_time.toString(),
    endTime: clip.end_time.toString(),
    format: clip.format,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const startTime = Number.parseFloat(formData.startTime)
      const endTime = Number.parseFloat(formData.endTime)

      if (isNaN(startTime) || isNaN(endTime)) {
        throw new Error("Please enter valid time values")
      }

      if (startTime >= endTime) {
        throw new Error("End time must be greater than start time")
      }

      await updateClip(clip.id, {
        title: formData.title,
        description: formData.description,
        start_time: startTime,
        end_time: endTime,
        format: formData.format as any,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update clip")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Clip</DialogTitle>
            <DialogDescription>Atualize os detalhes e tempo do clip</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                placeholder="Digite o título do clip"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Digite a descrição do clip"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-start-time">Tempo Inicial (segundos)</Label>
                <Input
                  id="edit-start-time"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end-time">Tempo Final (segundos)</Label>
                <Input
                  id="edit-end-time"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="60"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-format">Formato</Label>
              <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                <SelectTrigger id="edit-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                  <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                  <SelectItem value="square">Quadrado (1:1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
