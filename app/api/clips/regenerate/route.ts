import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { generateClipMetadata } from "@/lib/ai/content-analyzer"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clipId, platform } = body

    if (!clipId) {
      return NextResponse.json({ error: "Clip ID is required" }, { status: 400 })
    }

    // Get clip and verify ownership
    const { data: clip, error: clipError } = await supabase
      .from("clips")
      .select(`
        *,
        project:projects!inner(user_id)
      `)
      .eq("id", clipId)
      .single()

    if (clipError || !clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 })
    }

    if (clip.project.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("[v0] Regenerating clip metadata with AI for platform:", platform)

    // Use AI to generate optimized metadata
    const metadata = await generateClipMetadata(clip.description || clip.title, platform || "youtube")

    // Update clip with new metadata
    const { data: updatedClip, error: updateError } = await supabase
      .from("clips")
      .update({
        title: metadata.title,
        description: metadata.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clipId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      clip: updatedClip,
      hashtags: metadata.hashtags,
      message: "Clip metadata regenerated with AI",
    })
  } catch (error) {
    console.error("[v0] Error regenerating clip:", error)
    return NextResponse.json({ error: "Failed to regenerate clip metadata" }, { status: 500 })
  }
}
