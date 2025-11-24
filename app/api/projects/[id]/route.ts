import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] GET /api/projects/[id] - User:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log("[v0] Fetching project:", id, "for user:", user.id)

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json({ error: "Project not found", details: error.message }, { status: 404 })
    }

    if (!project) {
      console.error("[v0] Project not found in database")
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log("[v0] Project found:", project.id)
    return NextResponse.json({ project })
  } catch (error) {
    console.error("[v0] Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    console.log("[v0] Deleting project:", id, "for user:", user.id)

    // Verify project belongs to user
    const { data: project } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", user.id).single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete project (clips will be deleted automatically due to cascade)
    const { error } = await supabase.from("projects").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting project:", error)
      throw error
    }

    console.log("[v0] Project deleted successfully:", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
