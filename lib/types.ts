export type JobStatus = "pending" | "processing" | "completed" | "failed"
export type VideoFormat = "vertical" | "horizontal" | "square"

export interface Project {
  id: string
  user_id: string
  youtube_url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  duration: number | null
  status: JobStatus
  progress?: number
  current_step?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface Clip {
  id: string
  project_id: string
  title: string
  description: string | null
  start_time: number
  end_time: number
  format: VideoFormat
  output_url: string | null
  thumbnail_url: string | null
  status: JobStatus
  created_at: string
  updated_at: string
}

export interface AdminSetting {
  id: string
  setting_key: string
  setting_value: any
  description: string | null
  updated_at: string
}

export interface ProcessingLog {
  id: string
  project_id: string
  step_name: string
  step_order: number
  status: "pending" | "processing" | "completed" | "failed"
  message: string | null
  details?: Record<string, any>
  started_at?: string
  completed_at?: string
  created_at: string
}
