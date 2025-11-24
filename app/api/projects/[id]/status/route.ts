import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] GET /api/projects/[id]/status - User:", user?.id, "Project:", id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, clips:clips(count)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError) {
      console.error("[v0] Project status error:", projectError)
      return NextResponse.json({ error: "Project not found", details: projectError.message }, { status: 404 })
    }

    if (!project) {
      console.error("[v0] Project not found for user:", user.id)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("[v0] Project status:", project.status, "Progress:", project.progress)
    return NextResponse.json({
      status: project.status,
      progress: project.progress || 0,
      current_step: project.current_step,
      clipCount: project.clips?.[0]?.count || 0,
      title: project.title,
      duration: project.duration,
    })
  } catch (error) {
    console.error("[v0] Error fetching project status:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
