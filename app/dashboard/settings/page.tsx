import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SettingsForm } from "@/components/settings/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: settings } = await supabase.from("admin_settings").select("*").order("setting_key")

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={data.user} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="mt-1 text-muted-foreground">Configure suas preferências de geração de clips</p>
        </div>
        <SettingsForm settings={settings || []} />
      </main>
    </div>
  )
}
