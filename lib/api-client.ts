export async function processVideo(projectId: string) {
  const response = await fetch("/api/process-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId }),
  })

  if (!response.ok) {
    throw new Error("Failed to process video")
  }

  return response.json()
}

export async function getClips(projectId: string) {
  const response = await fetch(`/api/clips?projectId=${projectId}`)

  if (!response.ok) {
    throw new Error("Failed to fetch clips")
  }

  return response.json()
}

export async function createClip(data: {
  projectId: string
  title: string
  description?: string
  startTime: number
  endTime: number
  format?: string
}) {
  const response = await fetch("/api/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to create clip")
  }

  return response.json()
}

export async function updateClip(
  id: string,
  data: Partial<{
    title: string
    description: string
    start_time: number
    end_time: number
    format: string
  }>,
) {
  const response = await fetch(`/api/clips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to update clip")
  }

  return response.json()
}

export async function deleteClip(id: string) {
  const response = await fetch(`/api/clips/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete clip")
  }

  return response.json()
}

export async function getProject(id: string) {
  const response = await fetch(`/api/projects/${id}`)

  if (!response.ok) {
    throw new Error("Failed to fetch project")
  }

  return response.json()
}

export async function deleteProject(id: string) {
  const response = await fetch(`/api/projects/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    throw new Error("Failed to delete project")
  }

  return response.json()
}

export async function getSettings() {
  const response = await fetch("/api/settings")

  if (!response.ok) {
    throw new Error("Failed to fetch settings")
  }

  return response.json()
}
