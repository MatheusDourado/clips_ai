import { generateText } from "ai"

export interface DubOverlayRequest {
  clipId: string
  projectId: string
  clipTitle: string
  clipText: string
  sourceLanguage: string
  targetLanguage: string
  voiceProfile?: string
  transcriptSegments?: Array<{ start: number; end: number; text: string }>
}

export interface DubOverlayResult {
  audioUrl: string
  overlayUrl: string
  targetLanguage: string
  voiceProfile: string
  script: string
  captions: Array<{ start: number; end: number; text: string }>
}

function buildOverlayPlaceholder(id: string, targetLanguage: string) {
  const query = encodeURIComponent(`dub-${id}-${targetLanguage}`)
  return `/placeholder.svg?height=1080&width=1920&query=${query}`
}

export async function createDubOverlay(request: DubOverlayRequest): Promise<DubOverlayResult> {
  const voiceProfile = request.voiceProfile || "neural-brazilian-female"
  const targetLanguage = request.targetLanguage || request.sourceLanguage || "pt-BR"

  let script = request.clipText

  try {
    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: `Você é um dublador profissional. Traduza o seguinte trecho para ${targetLanguage} mantendo tom natural e pronto para locução.\n\nTítulo do clip: ${request.clipTitle}\nTrecho original:\n${request.clipText}`,
      temperature: 0.4,
      maxTokens: 320,
    })

    if (text) {
      script = text.trim()
    }
  } catch (error) {
    console.error("[v0] Erro ao gerar script de dublagem:", error)
  }

  const captions =
    request.transcriptSegments?.map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: script.length > 0 ? script : segment.text,
    })) ||
    [
      {
        start: 0,
        end: Math.max(3, request.clipText.length / 12),
        text: script,
      },
    ]

  return {
    audioUrl: `/placeholder.svg?height=200&width=200&query=${encodeURIComponent("dub-audio")}`,
    overlayUrl: buildOverlayPlaceholder(request.clipId, targetLanguage),
    targetLanguage,
    voiceProfile,
    script,
    captions,
  }
}
