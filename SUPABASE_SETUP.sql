-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- This sets up the two tables RightWords needs

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  is_pro boolean default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Auto-create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Sessions table (logs each tool use)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tool text not null check (tool in ('statement', 'coaching')),
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Row Level Security — users can only see their own data
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);
