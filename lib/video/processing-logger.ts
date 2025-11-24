import { createClient } from "@/lib/supabase/server"

export interface ProcessingStep {
  name: string
  order: number
  status: "pending" | "processing" | "completed" | "failed"
  message?: string
  details?: Record<string, any>
  started_at?: string
  completed_at?: string
}

export const PROCESSING_STEPS = {
  DOWNLOAD: { name: "Download do YouTube", order: 1 },
  EXTRACT_AUDIO: { name: "Extraindo áudio", order: 2 },
  TRANSCRIPTION: { name: "Transcrição com IA", order: 3 },
  ANALYSIS: { name: "Análise de conteúdo", order: 4 },
  CLIP_GENERATION: { name: "Gerando cortes", order: 5 },
  SUBTITLE_GENERATION: { name: "Gerando legendas", order: 6 },
  VIDEO_EDITING: { name: "Editando vídeos", order: 7 },
  DUBBING: { name: "Preparando áudio", order: 8 },
  FINALIZATION: { name: "Finalizando", order: 9 },
} as const

export class ProcessingLogger {
  private projectId: string

  constructor(projectId: string) {
    this.projectId = projectId
  }

  async initializeSteps() {
    const supabase = await createClient()

    // Create all steps as pending
    const steps = Object.values(PROCESSING_STEPS).map((step) => ({
      id: `${this.projectId}-${step.order}`,
      step_name: step.name,
      step_order: step.order,
      status: "pending",
      message: "Aguardando...",
      created_at: new Date().toISOString(),
    }))

    // Get current project
    const { data: project } = await supabase.from("projects").select("metadata").eq("id", this.projectId).single()

    const metadata = project?.metadata || {}
    metadata.processing_logs = steps

    const { error } = await supabase.from("projects").update({ metadata }).eq("id", this.projectId)

    if (error) {
      console.error("[v0] Error initializing steps:", error)
      throw error
    }
  }

  async updateStep(
    stepOrder: number,
    status: "processing" | "completed" | "failed",
    message?: string,
    details?: Record<string, any>,
  ) {
    const supabase = await createClient()

    // Get current logs
    const { data: project } = await supabase.from("projects").select("metadata").eq("id", this.projectId).single()

    const metadata = project?.metadata || {}
    const logs = metadata.processing_logs || []

    // Find and update the step
    const stepIndex = logs.findIndex((log: any) => log.step_order === stepOrder)

    if (stepIndex !== -1) {
      logs[stepIndex].status = status
      logs[stepIndex].message = message || this.getDefaultMessage(status)
      logs[stepIndex].details = details

      if (status === "processing") {
        logs[stepIndex].started_at = new Date().toISOString()
      } else if (status === "completed" || status === "failed") {
        logs[stepIndex].completed_at = new Date().toISOString()
      }
    }

    metadata.processing_logs = logs

    // Update project progress
    const totalSteps = Object.keys(PROCESSING_STEPS).length
    const progress = Math.round((stepOrder / totalSteps) * 100)

    const stepName = Object.values(PROCESSING_STEPS).find((s) => s.order === stepOrder)?.name

    const { error } = await supabase
      .from("projects")
      .update({
        metadata,
        progress,
        current_step: stepName,
        status:
          status === "failed"
            ? "failed"
            : status === "completed" && stepOrder === totalSteps
              ? "completed"
              : "processing",
        error_message: status === "failed" ? message : null,
      })
      .eq("id", this.projectId)

    if (error) {
      console.error("[v0] Error updating step:", error)
      throw error
    }
  }

  private getDefaultMessage(status: string): string {
    const messages = {
      processing: "Em andamento...",
      completed: "Concluído",
      failed: "Falhou",
    }
    return messages[status as keyof typeof messages] || ""
  }

  async logError(stepOrder: number, error: Error) {
    await this.updateStep(stepOrder, "failed", error.message, {
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }
}
