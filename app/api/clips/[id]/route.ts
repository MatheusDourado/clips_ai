import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify clip belongs to user through project
    const { data: clip } = await supabase
      .from("clips")
      .select("*, projects!inner(*)")
      .eq("id", id)
      .eq("projects.user_id", user.id)
      .single()

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 })
    }

    // Update clip
    const { data: updatedClip, error } = await supabase.from("clips").update(body).eq("id", id).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json({ clip: updatedClip })
  } catch (error) {
    console.error("[v0] Error updating clip:", error)
    return NextResponse.json({ error: "Failed to update clip" }, { status: 500 })
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

    // Verify clip belongs to user through project
    const { data: clip } = await supabase
      .from("clips")
      .select("*, projects!inner(*)")
      .eq("id", id)
      .eq("projects.user_id", user.id)
      .single()

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 })
    }

    // Delete clip
    const { error } = await supabase.from("clips").delete().eq("id", id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting clip:", error)
    return NextResponse.json({ error: "Failed to delete clip" }, { status: 500 })
  }
}
