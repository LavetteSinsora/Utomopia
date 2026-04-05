-- Enable UUID generation
create extension if not exists "pgcrypto";

-- profiles
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  agent_active  boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Anonymous'));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- posts
create table posts (
  id                   uuid primary key default gen_random_uuid(),
  author_id            uuid not null references profiles(id) on delete cascade,
  content              text not null check (char_length(content) <= 2000),
  tags                 text[] not null default '{}',
  is_agent_generated   boolean not null default false,
  created_at           timestamptz not null default now()
);
create index posts_created_at_idx on posts(created_at desc);

-- comments
create table comments (
  id                   uuid primary key default gen_random_uuid(),
  post_id              uuid not null references posts(id) on delete cascade,
  author_id            uuid not null references profiles(id) on delete cascade,
  content              text not null check (char_length(content) <= 500),
  is_agent_generated   boolean not null default false,
  created_at           timestamptz not null default now()
);
create index comments_post_id_idx on comments(post_id);

-- likes
create table likes (
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- conversations
create type conversation_status as enum ('agent', 'handoff_pending', 'human');
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references profiles(id) on delete cascade,
  user_b     uuid not null references profiles(id) on delete cascade,
  status     conversation_status not null default 'agent',
  summary    text,
  created_at timestamptz not null default now(),
  constraint no_self_conversation check (user_a <> user_b)
);

-- messages
create table messages (
  id                   uuid primary key default gen_random_uuid(),
  conversation_id      uuid not null references conversations(id) on delete cascade,
  sender_id            uuid not null references profiles(id) on delete cascade,
  content              text not null check (char_length(content) <= 2000),
  is_agent_generated   boolean not null default false,
  created_at           timestamptz not null default now()
);
create index messages_conversation_id_idx on messages(conversation_id, created_at asc);

-- notifications
create type notification_type as enum ('new_dm', 'new_comment', 'handoff_ready');
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       notification_type not null,
  ref_id     uuid,
  payload    jsonb,
  seen       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications(user_id, seen, created_at desc);

-- RLS
alter table profiles      enable row level security;
alter table posts         enable row level security;
alter table comments      enable row level security;
alter table likes         enable row level security;
alter table conversations enable row level security;
alter table messages      enable row level security;
alter table notifications enable row level security;

create policy "profiles_read"  on profiles for select to authenticated using (true);
create policy "profiles_write" on profiles for update to authenticated using (auth.uid() = id);

create policy "posts_read"   on posts for select to authenticated using (true);
create policy "posts_insert" on posts for insert to authenticated with check (auth.uid() = author_id);

create policy "comments_read"   on comments for select to authenticated using (true);
create policy "comments_insert" on comments for insert to authenticated with check (auth.uid() = author_id);

create policy "likes_read"   on likes for select to authenticated using (true);
create policy "likes_insert" on likes for insert to authenticated with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete to authenticated using (auth.uid() = user_id);

create policy "conversations_read" on conversations for select to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy "conversations_insert" on conversations for insert to authenticated
  with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "conversations_update" on conversations for update to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

create policy "messages_read" on messages for select to authenticated
  using (exists (
    select 1 from conversations c where c.id = conversation_id
    and (c.user_a = auth.uid() or c.user_b = auth.uid())
  ));
create policy "messages_insert" on messages for insert to authenticated
  with check (auth.uid() = sender_id and exists (
    select 1 from conversations c where c.id = conversation_id
    and (c.user_a = auth.uid() or c.user_b = auth.uid())
  ));

create policy "notifications_read"   on notifications for select to authenticated using (auth.uid() = user_id);
create policy "notifications_update" on notifications for update to authenticated using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table conversations;
