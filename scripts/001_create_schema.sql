-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types for job status and video format
create type job_status as enum ('pending', 'processing', 'completed', 'failed');
create type video_format as enum ('vertical', 'horizontal', 'square');

-- Projects table to store video processing jobs
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  youtube_url text not null,
  title text,
  description text,
  thumbnail_url text,
  duration integer, -- in seconds
  status job_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clips table to store generated video clips
create table if not exists public.clips (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  start_time real not null, -- in seconds
  end_time real not null, -- in seconds
  format video_format default 'vertical',
  output_url text,
  thumbnail_url text,
  status job_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Admin settings table
create table if not exists public.admin_settings (
  id uuid primary key default uuid_generate_v4(),
  setting_key text unique not null,
  setting_value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.projects enable row level security;
alter table public.clips enable row level security;
alter table public.admin_settings enable row level security;

-- Projects policies
create policy "users_view_own_projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "users_insert_own_projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "users_delete_own_projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Clips policies
create policy "users_view_own_clips"
  on public.clips for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = clips.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users_insert_own_clips"
  on public.clips for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = clips.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users_update_own_clips"
  on public.clips for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = clips.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "users_delete_own_clips"
  on public.clips for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = clips.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Admin settings policies (read-only for all authenticated users, write for admins only)
create policy "authenticated_users_view_settings"
  on public.admin_settings for select
  using (auth.role() = 'authenticated');

-- Insert default admin settings
insert into public.admin_settings (setting_key, setting_value, description) values
  ('clip_duration_max', '60', 'Maximum clip duration in seconds'),
  ('clip_duration_min', '10', 'Minimum clip duration in seconds'),
  ('supported_languages', '["pt-BR", "en-US", "es-ES"]', 'Supported languages for transcription'),
  ('default_format', '"vertical"', 'Default video format (vertical, horizontal, square)'),
  ('max_clips_per_project', '10', 'Maximum number of clips per project')
on conflict (setting_key) do nothing;

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_projects_updated_at before update on public.projects
  for each row execute function update_updated_at_column();

create trigger update_clips_updated_at before update on public.clips
  for each row execute function update_updated_at_column();

create trigger update_admin_settings_updated_at before update on public.admin_settings
  for each row execute function update_updated_at_column();
