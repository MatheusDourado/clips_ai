import { generateText } from "ai"

export interface ClipSuggestion {
  title: string
  description: string
  startTime: number
  endTime: number
  score: number
  keywords: string[]
  hook: string
}

export interface AnalysisResult {
  clips: ClipSuggestion[]
  summary: string
  mainTopics: string[]
}

/**
 * Analyze video transcription to identify the best moments for clips
 * Uses Groq LLM to understand content and suggest viral-worthy clips
 */
export async function analyzeContentForClips(
  transcription: string,
  segments: Array<{ start: number; end: number; text: string }>,
  clipDuration: { min: number; max: number } = { min: 30, max: 90 },
  maxClips = 10, // Adicionar parâmetro para número máximo de clips
): Promise<AnalysisResult> {
  console.log("[v0] Iniciando análise de IA do conteúdo...")
  console.log("[v0] Comprimento da transcrição:", transcription.length, "caracteres")
  console.log("[v0] Segmentos:", segments.length)
  console.log("[v0] Configuração: gerar até", maxClips, "clips")

  const segmentsText = segments.map((s, i) => `[${Math.floor(s.start)}s - ${Math.floor(s.end)}s] ${s.text}`).join("\n")

  const prompt = `Você é um especialista em criar clips virais para redes sociais (YouTube Shorts, TikTok, Instagram Reels).

Analise esta transcrição COMPLETA de podcast/vídeo e identifique os ${maxClips} MELHORES momentos para criar clips curtos (${clipDuration.min}-${clipDuration.max} segundos).

IMPORTANTE: Analise TODO o conteúdo e identifique até ${maxClips} momentos diferentes ao longo de TODA a duração do vídeo, não apenas no início!

TRANSCRIÇÃO COM TIMESTAMPS:
${segmentsText}

CRITÉRIOS PARA SELECIONAR CLIPS:
1. **Auto-contido**: O clip deve fazer sentido sozinho, sem contexto prévio
2. **Hook forte**: Deve começar com algo que prende atenção imediatamente
3. **Valor**: Informação útil, insights únicos, ou entretenimento
4. **Viralidade**: Potencial de engajamento (polêmico, inspirador, engraçado, surpreendente)
5. **Duração ideal**: Entre ${clipDuration.min}-${clipDuration.max} segundos
6. **Momento completo**: Começo, meio e fim claros
7. **DISTRIBUIÇÃO**: Selecione momentos de DIFERENTES partes do vídeo, não apenas do início!

Para cada clip, forneça:
- title: Título CHAMATIVO e curto (max 60 caracteres)
- description: Descrição que vende o conteúdo (2-3 frases)
- startTime: Tempo inicial em SEGUNDOS (número inteiro)
- endTime: Tempo final em SEGUNDOS (número inteiro)
- score: Score de viralidade de 0-100 (seja criterioso!)
- keywords: 4-6 palavras-chave relevantes
- hook: A primeira frase exata do clip que prende atenção

Também forneça:
- summary: Resumo geral do vídeo (1 frase)
- mainTopics: 3-5 tópicos principais discutidos

IMPORTANTE: 
- Use APENAS os timestamps que existem na transcrição
- Garanta que startTime < endTime
- Duração do clip = endTime - startTime (deve estar entre ${clipDuration.min}-${clipDuration.max})
- Priorize QUALIDADE sobre QUANTIDADE
- DISTRIBUA os clips ao longo de TODO o vídeo, não apenas no início
- Retorne EXATAMENTE ${maxClips} clips (ou o máximo possível se o vídeo for muito curto)

Responda APENAS com JSON válido neste formato exato:
{
  "clips": [
    {
      "title": "string",
      "description": "string", 
      "startTime": number,
      "endTime": number,
      "score": number,
      "keywords": ["string"],
      "hook": "string"
    }
  ],
  "summary": "string",
  "mainTopics": ["string"]
}`

  try {
    console.log("[v0] Chamando IA Groq para análise de conteúdo...")

    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt,
      temperature: 0.7,
      maxTokens: 4000, // Aumentar tokens para permitir mais clips
    })

    console.log("[v0] Resposta da IA recebida")
    console.log("[v0] Prévia da resposta:", text.substring(0, 200))

    let analysis: AnalysisResult

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        console.log("[v0] Resposta da IA parseada com sucesso")
        console.log("[v0] Clips encontrados:", parsed.clips?.length || 0)

        // Validate and clean the response
        analysis = {
          clips: (parsed.clips || [])
            .filter((clip: ClipSuggestion) => {
              // Validate clip has required fields and valid times
              return (
                clip.title &&
                clip.description &&
                typeof clip.startTime === "number" &&
                typeof clip.endTime === "number" &&
                clip.startTime < clip.endTime &&
                clip.endTime - clip.startTime >= clipDuration.min &&
                clip.endTime - clip.startTime <= clipDuration.max
              )
            })
            .map((clip: ClipSuggestion) => ({
              title: clip.title.substring(0, 60),
              description: clip.description,
              startTime: Math.floor(clip.startTime),
              endTime: Math.floor(clip.endTime),
              score: clip.score || 75,
              keywords: clip.keywords || [],
              hook: clip.hook || clip.title,
            }))
            .slice(0, maxClips), // Limitar ao número máximo configurado
          summary: parsed.summary || "Análise de conteúdo",
          mainTopics: parsed.mainTopics || [],
        }

        console.log("[v0] Clips válidos após filtragem:", analysis.clips.length)

        if (analysis.clips.length > 0) {
          return analysis
        }
      } catch (parseError) {
        console.error("[v0] Falha ao parsear JSON da IA:", parseError)
      }
    }

    console.log("[v0] Falha no parse da resposta da IA, usando fallback inteligente")
    return generateIntelligentFallback(segments, clipDuration, maxClips)
  } catch (error) {
    console.error("[v0] Falha na análise da IA:", error)
    return generateIntelligentFallback(segments, clipDuration, maxClips)
  }
}

function generateIntelligentFallback(
  segments: Array<{ start: number; end: number; text: string }>,
  clipDuration: { min: number; max: number },
  maxClips = 10,
): AnalysisResult {
  console.log("[v0] Gerando clips inteligentes de fallback a partir dos segmentos")
  console.log("[v0] Alvo: até", maxClips, "clips")

  const clips: ClipSuggestion[] = []
  let currentClipStart = 0
  let currentClipText = ""
  let segmentGroup: typeof segments = []

  // Group segments into clips of appropriate duration
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    segmentGroup.push(segment)
    currentClipText += " " + segment.text

    const duration = segment.end - currentClipStart

    // If we've reached a good duration, create a clip
    if (duration >= clipDuration.min && duration <= clipDuration.max) {
      clips.push({
        title: currentClipText.trim().substring(0, 60),
        description: currentClipText.trim().substring(0, 150),
        startTime: Math.floor(currentClipStart),
        endTime: Math.floor(segment.end),
        score: 70 + Math.random() * 20, // Random score between 70-90
        keywords: ["clip", "conteúdo", "viral"],
        hook: segmentGroup[0].text,
      })

      // Start next clip
      currentClipStart = segment.end
      currentClipText = ""
      segmentGroup = []
    } else if (duration > clipDuration.max) {
      // Clip too long, finish at previous segment
      const prevSegment = segments[i - 1]
      if (prevSegment) {
        clips.push({
          title: currentClipText.trim().substring(0, 60),
          description: currentClipText.trim().substring(0, 150),
          startTime: Math.floor(currentClipStart),
          endTime: Math.floor(prevSegment.end),
          score: 70 + Math.random() * 20,
          keywords: ["clip", "conteúdo", "viral"],
          hook: segmentGroup[0].text,
        })
      }

      currentClipStart = segment.start
      currentClipText = segment.text
      segmentGroup = [segment]
    }
  }

  console.log("[v0] Gerados", clips.length, "clips da análise de fallback")

  return {
    clips: clips.slice(0, maxClips), // Retornar até maxClips
    summary: "Conteúdo analisado automaticamente",
    mainTopics: ["Conteúdo", "Podcast", "Vídeo"],
  }
}

/**
 * Generate optimized title and description for a clip
 */
export async function generateClipMetadata(
  clipText: string,
  platform: "youtube" | "tiktok" | "instagram" = "youtube",
): Promise<{ title: string; description: string; hashtags: string[] }> {
  console.log("[v0] Gerando metadados para plataforma:", platform)

  const platformLimits = {
    youtube: { titleMax: 100, descMax: 5000 },
    tiktok: { titleMax: 100, descMax: 2200 },
    instagram: { titleMax: 100, descMax: 2200 },
  }

  const limits = platformLimits[platform]

  try {
    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt: `Você é um especialista em otimização de conteúdo para redes sociais.

Crie metadados otimizados para ${platform.toUpperCase()}:

CONTEÚDO DO CLIP:
${clipText.substring(0, 500)}

REGRAS:
- Título: max ${limits.titleMax} caracteres, deve ser EXTREMAMENTE chamativo e despertar curiosidade
- Descrição: max ${limits.descMax} caracteres, deve engajar e explicar o valor do conteúdo
- Hashtags: 5-10 hashtags relevantes e populares para ${platform}

IMPORTANTE: Responda APENAS com JSON válido no formato:
{"title":"seu título aqui","description":"sua descrição aqui","hashtags":["tag1","tag2","tag3"]}`,
      temperature: 0.8,
      maxTokens: 800,
    })

    console.log("[v0] Resposta da IA:", text)

    // Try to parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])

      // Validate response has required fields
      if (parsed.title && parsed.description && parsed.hashtags) {
        console.log("[v0] Metadados gerados com sucesso")
        return {
          title: parsed.title.substring(0, limits.titleMax),
          description: parsed.description.substring(0, limits.descMax),
          hashtags: parsed.hashtags,
        }
      }
    }

    console.log("[v0] Falha ao parsear resposta da IA, usando fallback")
    throw new Error("Formato de resposta da IA inválido")
  } catch (error) {
    console.error("[v0] Erro ao gerar metadados:", error)

    const platformHashtags = {
      youtube: ["#youtube", "#viral", "#podcast", "#conteúdo", "#brasil"],
      tiktok: ["#fyp", "#viral", "#tiktok", "#brasil", "#foryou"],
      instagram: ["#reels", "#viral", "#instagram", "#brasil", "#explore"],
    }

    return {
      title: clipText.substring(0, Math.min(60, limits.titleMax)),
      description: clipText.substring(0, Math.min(200, limits.descMax)),
      hashtags: platformHashtags[platform],
    }
  }
}
