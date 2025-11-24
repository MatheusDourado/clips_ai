-- Add metadata field to projects if not exists
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add progress and tracking fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_step TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_metadata ON public.projects USING gin(metadata);
