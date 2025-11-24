import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get clips for the project
    const { data: clips, error } = await supabase
      .from("clips")
      .select("*")
      .eq("project_id", projectId)
      .order("start_time", { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ clips })
  } catch (error) {
    console.error("[v0] Error fetching clips:", error)
    return NextResponse.json({ error: "Failed to fetch clips" }, { status: 500 })
  }
}

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
    const { projectId, title, description, startTime, endTime, format } = body

    if (!projectId || !title || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Create new clip
    const { data: clip, error } = await supabase
      .from("clips")
      .insert({
        project_id: projectId,
        title,
        description: description || null,
        start_time: startTime,
        end_time: endTime,
        format: format || "vertical",
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Trigger clip generation (simulated)
    setTimeout(async () => {
      try {
        const supabase = await createClient()
        await supabase
          .from("clips")
          .update({
            status: "completed",
            output_url: `/placeholder.svg?height=1920&width=1080&query=video-clip`,
            thumbnail_url: `/placeholder.svg?height=720&width=1280&query=clip-thumbnail`,
          })
          .eq("id", clip.id)
      } catch (error) {
        console.error("[v0] Error generating clip:", error)
      }
    }, 3000)

    return NextResponse.json({ clip })
  } catch (error) {
    console.error("[v0] Error creating clip:", error)
    return NextResponse.json({ error: "Failed to create clip" }, { status: 500 })
  }
}
