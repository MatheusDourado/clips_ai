import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: settings, error } = await supabase.from("admin_settings").select("*")

    if (error) {
      throw error
    }

    // Convert to key-value object
    const settingsObject = settings.reduce(
      (acc, setting) => {
        acc[setting.setting_key] = setting.setting_value
        return acc
      },
      {} as Record<string, any>,
    )

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    console.error("[v0] Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
