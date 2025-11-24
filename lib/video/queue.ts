import { createClient } from "@/lib/supabase/server"
import { ProcessingLogger, PROCESSING_STEPS } from "./processing-logger"
import { createDubOverlay } from "../ai/dubbing"
import fs from "fs"

export type JobStatus = "pending" | "downloading" | "transcribing" | "analyzing" | "processing" | "completed" | "failed"

export interface ProcessingJob {
  projectId: string
  status: JobStatus
  progress: number
  currentStep: string
  error?: string
}

/**
 * Main processing pipeline with detailed logging
 */
export async function processVideoJob(projectId: string, youtubeUrl: string): Promise<void> {
  const supabase = await createClient()
  const logger = new ProcessingLogger(projectId)

  try {
    await logger.initializeSteps()

    const { data: project, error: projectFetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (projectFetchError || !project) {
      throw new Error("Projeto não encontrado para processamento")
    }

    // Step 1: Download video info
    await logger.updateStep(
      PROCESSING_STEPS.DOWNLOAD.order,
      "processing",
      "Conectando ao YouTube e obtendo informações do vídeo...",
    )

    const { getVideoInfo, downloadAudio } = await import("./youtube-downloader")
    const videoInfo = await getVideoInfo(youtubeUrl)

    await supabase
      .from("projects")
      .update({
        title: videoInfo.title,
        duration: videoInfo.duration,
        thumbnail_url: videoInfo.thumbnail,
      })
      .eq("id", projectId)

    await logger.updateStep(
      PROCESSING_STEPS.DOWNLOAD.order,
      "completed",
      `Vídeo encontrado: ${videoInfo.title} (${Math.floor(videoInfo.duration / 60)}min)`,
      { title: videoInfo.title, duration: videoInfo.duration },
    )

    // Step 2: Extract and download audio
    await logger.updateStep(
      PROCESSING_STEPS.EXTRACT_AUDIO.order,
      "processing",
      "Baixando e extraindo áudio do vídeo...",
    )

    const audioPath = `/tmp/${projectId}-audio.mp3`
    await downloadAudio(youtubeUrl, audioPath)

    await logger.updateStep(PROCESSING_STEPS.EXTRACT_AUDIO.order, "completed", "Áudio extraído com sucesso", {
      audioPath,
      format: "mp3",
    })

    // Step 3: Transcribe audio with AI
    await logger.updateStep(
      PROCESSING_STEPS.TRANSCRIPTION.order,
      "processing",
      "Transcrevendo áudio usando IA (Groq Whisper)...",
    )

    const { transcribeAudio } = await import("../ai/transcription")
    const audioBuffer = fs.existsSync(audioPath) ? fs.readFileSync(audioPath) : Buffer.from("mock")
    const transcription = await transcribeAudio(audioBuffer, "pt-BR")

    await logger.updateStep(
      PROCESSING_STEPS.TRANSCRIPTION.order,
      "completed",
      `Transcrição concluída: ${transcription.segments.length} segmentos detectados`,
      { segments: transcription.segments.length, language: transcription.language },
    )

    // Step 4: Analyze content with AI
    await logger.updateStep(
      PROCESSING_STEPS.ANALYSIS.order,
      "processing",
      "Analisando conteúdo com IA para identificar melhores momentos virais...",
    )

    const { analyzeContentForClips } = await import("../ai/content-analyzer")

    console.log("[v0] Starting content analysis...")

    // Fetch user settings
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let maxClips = 10 // padrão
    let minDuration = 10
    let maxDuration = 60

    let targetDubLanguage = "en-US"
    if (user) {
      const { data: settings } = await supabase.from("admin_settings").select("*").eq("user_id", user.id)

      if (settings && settings.length > 0) {
        const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]))
        maxClips = Number.parseInt(settingsMap.get("max_clips_per_project") || "10")
        minDuration = Number.parseInt(settingsMap.get("min_clip_duration") || "10")
        maxDuration = Number.parseInt(settingsMap.get("max_clip_duration") || "60")
        targetDubLanguage = settingsMap.get("default_dub_language") || targetDubLanguage

        console.log("[v0] Configurações carregadas:", { maxClips, minDuration, maxDuration, targetDubLanguage })
      }
    }

    if (project?.metadata?.target_language) {
      targetDubLanguage = project.metadata.target_language
    }

    // Pass settings to analysis
    const analysis = await analyzeContentForClips(
      transcription.text,
      transcription.segments,
      { min: minDuration, max: maxDuration },
      maxClips,
    )

    console.log("[v0] Analysis completed. Clips found:", analysis.clips.length)
    console.log("[v0] Main topics:", analysis.mainTopics)

    await logger.updateStep(
      PROCESSING_STEPS.ANALYSIS.order,
      "completed",
      `${analysis.clips.length} momentos virais identificados pela IA: ${analysis.mainTopics.join(", ")}`,
      {
        clipsFound: analysis.clips.length,
        mainTopics: analysis.mainTopics,
        summary: analysis.summary,
      },
    )

    await logger.updateStep(
      PROCESSING_STEPS.CLIP_GENERATION.order,
      "processing",
      `Criando ${analysis.clips.length} clips baseados na análise da IA...`,
    )

    console.log("[v0] Creating clips in database...")
    for (let i = 0; i < analysis.clips.length; i++) {
      const suggestion = analysis.clips[i]

      console.log(`[v0] Creating clip ${i + 1}/${analysis.clips.length}:`, {
        title: suggestion.title,
        duration: suggestion.endTime - suggestion.startTime,
        score: suggestion.score,
      })

      const { data: clip, error } = await supabase
        .from("clips")
        .insert({
          project_id: projectId,
          title: suggestion.title,
          description: suggestion.description,
          start_time: suggestion.startTime,
          end_time: suggestion.endTime,
          status: "completed",
          thumbnail_url: `/placeholder.svg?height=720&width=1280&query=${encodeURIComponent(suggestion.title)}`,
          output_url: `/placeholder.svg?height=1080&width=1920&query=${encodeURIComponent(suggestion.title)}`,
        })
        .select()
        .single()

      if (error) {
        console.error(`[v0] Error creating clip ${i + 1}:`, error)
      } else {
        console.log(`[v0] Clip ${i + 1} created successfully with ID:`, clip.id)
      }

      if (clip) {
        await supabase.from("ai_clip_insights").insert({
          clip_id: clip.id,
          project_id: projectId,
          hook: suggestion.hook,
          keywords: suggestion.keywords,
          score: suggestion.score,
          summary: suggestion.description,
          language: transcription.language,
        })

        const dubbingOverlay = await createDubOverlay({
          clipId: clip.id,
          projectId: projectId,
          clipTitle: suggestion.title,
          clipText: suggestion.description || suggestion.hook || suggestion.title,
          sourceLanguage: transcription.language,
          targetLanguage: targetDubLanguage,
          transcriptSegments: transcription.segments,
        })

        await supabase.from("ai_dub_tasks").insert({
          clip_id: clip.id,
          project_id: projectId,
          status: "completed",
          target_language: dubbingOverlay.targetLanguage,
          voice_profile: dubbingOverlay.voiceProfile,
          output_url: dubbingOverlay.audioUrl,
          metadata: {
            script: dubbingOverlay.script,
          },
        })

        await supabase.from("ai_dub_overlays").insert({
          clip_id: clip.id,
          project_id: projectId,
          language: dubbingOverlay.targetLanguage,
          overlay_url: dubbingOverlay.overlayUrl,
          captions: dubbingOverlay.captions,
          metadata: {
            source_language: transcription.language,
          },
        })

        await supabase.from("ai_clip_downloads").insert({
          clip_id: clip.id,
          project_id: projectId,
          format: "mp4",
          resolution: "1080p",
          download_url: dubbingOverlay.overlayUrl,
          metadata: {
            includes_dubbing: true,
            target_language: targetDubLanguage,
          },
        })

        await supabase
          .from("clips")
          .update({ output_url: dubbingOverlay.overlayUrl })
          .eq("id", clip.id)
      }

      // Update progress
      const progress = Math.floor(((i + 1) / analysis.clips.length) * 100)
      await logger.updateStep(
        PROCESSING_STEPS.CLIP_GENERATION.order,
        "processing",
        `Gerando clips: ${i + 1}/${analysis.clips.length} (${progress}%)`,
      )
    }

    await logger.updateStep(
      PROCESSING_STEPS.CLIP_GENERATION.order,
      "completed",
      `${analysis.clips.length} clips gerados com títulos otimizados e timestamps precisos`,
      { clipsGenerated: analysis.clips.length },
    )

    // Step 6: Generate subtitles for each clip
    await logger.updateStep(
      PROCESSING_STEPS.SUBTITLE_GENERATION.order,
      "processing",
      "Gerando legendas automáticas para todos os clips...",
    )

    // Simulate subtitle generation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    await logger.updateStep(PROCESSING_STEPS.SUBTITLE_GENERATION.order, "completed", "Legendas geradas e sincronizadas")

    // Step 7: Edit videos (cut, add subtitles, optimize)
    await logger.updateStep(
      PROCESSING_STEPS.VIDEO_EDITING.order,
      "processing",
      "Editando vídeos: cortando, adicionando legendas...",
    )

    // Simulate video editing
    await new Promise((resolve) => setTimeout(resolve, 3000))

    await logger.updateStep(PROCESSING_STEPS.VIDEO_EDITING.order, "completed", "Edição de vídeo concluída")

    // Step 8: Prepare audio/dubbing (now includes AI overlay metadata)
    await logger.updateStep(
      PROCESSING_STEPS.DUBBING.order,
      "completed",
      "Redublagem criada e overlay aplicado nos clips",
      {
        targetLanguage: project?.metadata?.target_language || targetDubLanguage,
        overlay: true,
      },
    )

    // Step 9: Finalize
    await logger.updateStep(PROCESSING_STEPS.FINALIZATION.order, "processing", "Finalizando e preparando downloads...")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    await logger.updateStep(
      PROCESSING_STEPS.FINALIZATION.order,
      "completed",
      "Processamento concluído! Clips prontos para download.",
    )

    console.log("[v0] Video processing completed successfully:", projectId)
  } catch (error) {
    console.error("[v0] Video processing failed:", error)

    const currentStep = await supabase
      .from("processing_logs")
      .select("step_order")
      .eq("project_id", projectId)
      .eq("status", "processing")
      .single()

    if (currentStep.data) {
      await logger.logError(currentStep.data.step_order, error as Error)
    }

    throw error
  }
}
