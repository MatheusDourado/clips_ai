import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: userResponse } = await supabase.auth.getUser()

    if (!userResponse?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select("*, projects!inner(user_id)")
      .eq("id", id)
      .single()

    if (clipError || !clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 })
    }

    if (clip.projects?.user_id !== userResponse.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const downloadUrl =
      clip.output_url ||
      `/placeholder.svg?height=1080&width=1920&query=${encodeURIComponent("clip-download")}`

    await supabase.from("ai_clip_downloads").insert({
      clip_id: clip.id,
      project_id: clip.project_id,
      format: clip.format || "mp4",
      resolution: "1080p",
      download_url: downloadUrl,
      metadata: {
        triggered_by: userResponse.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      downloadUrl,
      clipInfo: {
        title: clip.title,
        duration: clip.end_time - clip.start_time,
        format: clip.format,
        language: clip.metadata?.target_language,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating clip download:", error)
    return NextResponse.json({ error: "Failed to prepare download" }, { status: 500 })
  }
}
