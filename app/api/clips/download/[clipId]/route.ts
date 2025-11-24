import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ clipId: string }> }) {
  try {
    const { clipId } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Buscar clip e verificar propriedade
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select(`
        *,
        project:projects!inner(user_id, youtube_url)
      `)
      .eq("id", clipId)
      .single()

    if (clipError || !clip) {
      return NextResponse.json({ error: "Clip não encontrado" }, { status: 404 })
    }

    if (clip.project.user_id !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    }

    console.log("[v0] Processando clip para download:", clip.title)

    // Em produção: processar vídeo real com FFmpeg
    const clipData = {
      title: clip.title,
      description: clip.description,
      duration: clip.end_time - clip.start_time,
      startTime: clip.start_time,
      endTime: clip.end_time,
      format: clip.format,
      youtubeUrl: clip.project.youtube_url,
      instructions: {
        pt: "Este é um placeholder. Em produção, este seria o vídeo processado.",
        en: "This is a placeholder. In production, this would be the processed video.",
      },
    }

    // Retornar como JSON para download (em produção seria MP4)
    return new NextResponse(JSON.stringify(clipData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="clip-${clip.title.replace(/[^a-z0-9]/gi, "-")}.json"`,
      },
    })
  } catch (error) {
    console.error("[v0] Erro ao baixar clip:", error)
    return NextResponse.json({ error: "Falha ao baixar clip" }, { status: 500 })
  }
}
