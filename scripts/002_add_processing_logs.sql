-- Add processing logs table
create table if not exists public.processing_logs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  step_name text not null,
  step_order integer not null,
  status text not null, -- 'pending', 'processing', 'completed', 'failed'
  message text,
  details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Add progress field to projects
alter table public.projects add column if not exists progress integer default 0;
alter table public.projects add column if not exists current_step text;
alter table public.projects add column if not exists error_message text;

-- Enable RLS for processing logs
alter table public.processing_logs enable row level security;

-- Processing logs policies
create policy "users_view_own_logs"
  on public.processing_logs for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = processing_logs.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users_insert_own_logs"
  on public.processing_logs for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = processing_logs.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists idx_processing_logs_project_id on public.processing_logs(project_id);
create index if not exists idx_processing_logs_step_order on public.processing_logs(project_id, step_order);
