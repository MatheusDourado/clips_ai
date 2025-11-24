import Groq from "groq-sdk"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
  language: string
}

/**
 * Transcribe audio using Groq Whisper API
 * For MVP, we'll use a mock implementation since Groq doesn't have Whisper yet
 * In production, use AssemblyAI (free tier) or other transcription services
 */
export async function transcribeAudio(audioBuffer: Buffer, language?: string): Promise<TranscriptionResult> {
  // For MVP: Mock transcription with timestamps
  // In production, replace with actual transcription API

  console.log("[v0] Transcribing audio...")

  // Simulate transcription delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock transcription with realistic segments
  const mockSegments: TranscriptionSegment[] = [
    { start: 0, end: 5, text: "Bem-vindo ao nosso podcast de hoje." },
    { start: 5, end: 12, text: "Vamos falar sobre inteligência artificial e como ela está mudando o mundo." },
    { start: 12, end: 18, text: "Isso é muito interessante porque a IA está em todos os lugares." },
    { start: 18, end: 25, text: "Você pode usar IA para automatizar tarefas, gerar conteúdo, e muito mais." },
    { start: 25, end: 32, text: "O futuro é agora e a tecnologia está evoluindo rapidamente." },
  ]

  return {
    text: mockSegments.map((s) => s.text).join(" "),
    segments: mockSegments,
    language: language || "pt-BR",
  }
}

/**
 * Generate SRT subtitle format from transcription segments
 */
export function generateSRT(segments: TranscriptionSegment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatSRTTime(segment.start)
      const endTime = formatSRTTime(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    })
    .join("\n")
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}
