import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ProjectHeader } from "@/components/project/project-header"
import { ClipGrid } from "@/components/project/clip-grid"
import { CreateClipDialog } from "@/components/project/create-clip-dialog"
import { ProcessingStatus } from "@/components/project/processing-status"
import { DetailedLogs } from "@/components/project/detailed-logs"

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", data.user.id)
    .single()

  if (!project) {
    redirect("/dashboard")
  }

  const { data: clips } = await supabase
    .from("clips")
    .select("*")
    .eq("project_id", id)
    .order("start_time", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={data.user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ProjectHeader project={project} />
        <ProcessingStatus project={project} />

        {project.status !== "completed" && project.status !== "failed" && (
          <div className="mt-6">
            <DetailedLogs projectId={id} autoRefresh={true} />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Clips Gerados</h2>
            <p className="mt-1 text-sm text-muted-foreground">{clips?.length || 0} clips disponíveis</p>
          </div>
          <CreateClipDialog projectId={id} />
        </div>
        <div className="mt-6">
          <ClipGrid clips={clips || []} projectId={id} />
        </div>
      </main>
    </div>
  )
}
