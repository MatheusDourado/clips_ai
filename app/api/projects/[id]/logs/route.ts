import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] GET /api/projects/[id]/logs - User:", user?.id, "Project:", id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (projectError) {
      console.error("[v0] Error fetching project for logs:", projectError)
      return NextResponse.json({ error: "Project not found", details: projectError.message }, { status: 404 })
    }

    if (!project) {
      console.error("[v0] Project not found for logs, user:", user.id)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse logs from metadata or create default structure
    const metadata = project.metadata || {}
    const logs = metadata.processing_logs || []

    console.log("[v0] Project metadata:", JSON.stringify(metadata, null, 2))
    console.log("[v0] Found", logs.length, "logs for project:", id)
    console.log("[v0] Logs:", JSON.stringify(logs, null, 2))

    return NextResponse.json({
      logs,
      project: {
        status: project.status,
        progress: project.progress || 0,
        current_step: project.current_step,
        error_message: project.error_message,
      },
    })
  } catch (error) {
    console.error("[v0] Error in logs API:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}
