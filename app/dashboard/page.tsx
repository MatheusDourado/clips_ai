import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectList } from "@/components/dashboard/project-list"
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={data.user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seus Projetos</h1>
            <p className="mt-1 text-muted-foreground">Crie e gerencie seus projetos de clips de vídeo</p>
          </div>
          <NewProjectDialog userId={data.user.id} />
        </div>
        <ProjectList projects={projects || []} />
      </main>
    </div>
  )
}
