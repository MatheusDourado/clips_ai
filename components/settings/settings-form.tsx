"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import type { AdminSetting } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface SettingsFormProps {
  settings: AdminSetting[]
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getSettingValue = (key: string) => {
    const setting = settings.find((s) => s.setting_key === key)
    return setting?.setting_value
  }

  const [clipDurationMax, setClipDurationMax] = useState(getSettingValue("clip_duration_max") || 60)
  const [clipDurationMin, setClipDurationMin] = useState(getSettingValue("clip_duration_min") || 10)
  const [defaultFormat, setDefaultFormat] = useState(getSettingValue("default_format") || "vertical")
  const [maxClipsPerProject, setMaxClipsPerProject] = useState(getSettingValue("max_clips_per_project") || 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)

    try {
      // In a real implementation, this would call an admin API to update settings
      // For now, we'll simulate a successful save
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Duração do Clip</CardTitle>
          <CardDescription>Defina a duração mínima e máxima para os clips gerados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="min-duration">Duração Mínima (segundos)</Label>
            <Input
              id="min-duration"
              type="number"
              min={5}
              max={300}
              value={clipDurationMin}
              onChange={(e) => setClipDurationMin(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">Clips menores que isso não serão gerados</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-duration">Duração Máxima (segundos)</Label>
            <Input
              id="max-duration"
              type="number"
              min={10}
              max={600}
              value={clipDurationMax}
              onChange={(e) => setClipDurationMax(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">Clips maiores que isso serão cortados ou divididos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formato de Vídeo</CardTitle>
          <CardDescription>Escolha o formato padrão para os clips gerados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="default-format">Formato Padrão</Label>
            <Select value={defaultFormat} onValueChange={setDefaultFormat}>
              <SelectTrigger id="default-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                <SelectItem value="horizontal">Horizontal (16:9)</SelectItem>
                <SelectItem value="square">Quadrado (1:1)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Otimizado para diferentes plataformas de redes sociais</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Limites do Projeto</CardTitle>
          <CardDescription>Configure os limites para geração de clips por projeto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label htmlFor="max-clips">Máximo de Clips por Projeto</Label>
            <Input
              id="max-clips"
              type="number"
              min={1}
              max={50}
              value={maxClipsPerProject}
              onChange={(e) => setMaxClipsPerProject(Number(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Limite o número de clips que podem ser gerados de um único vídeo
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suporte de Idiomas</CardTitle>
          <CardDescription>Idiomas suportados para transcrição e análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium text-foreground">Português (Brasil)</p>
                <p className="text-sm text-muted-foreground">pt-BR</p>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium text-foreground">Inglês (EUA)</p>
                <p className="text-sm text-muted-foreground">en-US</p>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium text-foreground">Espanhol (Espanha)</p>
                <p className="text-sm text-muted-foreground">es-ES</p>
              </div>
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Configurações
        </Button>
        {success && <p className="text-sm font-medium text-primary">Configurações salvas com sucesso!</p>}
      </div>
    </form>
  )
}
