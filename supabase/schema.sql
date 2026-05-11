-- ============================================
-- 校内科研组队平台 - 数据库建表脚本
-- 使用方式：在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 邀请码表
create table if not exists invite_codes (
  code text primary key,
  created_by uuid,
  used_by uuid,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- 2. 用户资料表（扩展 Supabase Auth 的 users 表）
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nickname text not null,
  avatar_url text,
  role text check (role in ('student', 'teacher')) not null default 'student',
  department text,
  grade text,
  bio text,
  skills text[] default '{}',
  research_interests text[] default '{}',
  contact_info jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 帖子表
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('find_team', 'find_member', 'find_mentor', 'share')) not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  status text check (status in ('open', 'closed')) default 'open',
  max_members int,
  deadline date,
  view_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 申请表
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  applicant_id uuid references profiles(id) on delete cascade not null,
  message text,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. 标签表
create table if not exists tags (
  id serial primary key,
  name text unique not null,
  category text check (category in ('skill', 'direction', 'course')),
  usage_count int default 0,
  created_at timestamptz default now()
);

-- 6. 通知表
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('application_received', 'application_accepted', 'application_rejected', 'system')) not null,
  title text not null,
  content text,
  related_post_id uuid references posts(id) on delete set null,
  related_user_id uuid references profiles(id) on delete set null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- 索引
-- ============================================

create index if not exists idx_posts_author on posts(author_id);
create index if not exists idx_posts_type on posts(type);
create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_created_at on posts(created_at desc);
create index if not exists idx_posts_tags on posts using gin(tags);
create index if not exists idx_applications_post on applications(post_id);
create index if not exists idx_applications_applicant on applications(applicant_id);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_unread on notifications(user_id) where is_read = false;
create index if not exists idx_profiles_skills on profiles using gin(skills);
create index if not exists idx_profiles_interests on profiles using gin(research_interests);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

alter table profiles enable row level security;
alter table posts enable row level security;
alter table applications enable row level security;
alter table notifications enable row level security;
alter table invite_codes enable row level security;
alter table tags enable row level security;

-- profiles: 所有人可查看，只有本人可修改
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- posts: 所有人可查看，作者可修改
create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Authenticated users can create posts"
  on posts for insert with check (auth.uid() = author_id);

create policy "Authors can update own posts"
  on posts for update using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on posts for delete using (auth.uid() = author_id);

-- applications: 帖子作者和申请人可查看
create policy "Post authors can view applications"
  on applications for select using (
    auth.uid() = applicant_id
    or auth.uid() in (select author_id from posts where id = applications.post_id)
  );

create policy "Authenticated users can create applications"
  on applications for insert with check (auth.uid() = applicant_id);

create policy "Post authors can update application status"
  on applications for update using (
    auth.uid() in (select author_id from posts where id = applications.post_id)
  );

-- notifications: 只有本人可查看和修改
create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = user_id);

-- 系统可插入通知（通过 service role）
create policy "System can insert notifications"
  on notifications for insert with check (true);

-- invite_codes: 所有认证用户可查看（用于验证），已注册用户可用
create policy "Anyone can check invite codes"
  on invite_codes for select using (true);

create policy "System can update invite codes"
  on invite_codes for update using (true);

-- tags: 所有人可查看
create policy "Tags are viewable by everyone"
  on tags for select using (true);

create policy "Authenticated users can insert tags"
  on tags for insert with check (auth.uid() is not null);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

create trigger applications_updated_at
  before update on applications
  for each row execute function update_updated_at();

-- ============================================
-- 预置一些邀请码（可自行修改）
-- ============================================

insert into invite_codes (code, expires_at) values
  ('RESEARCH2024A', '2025-12-31'::timestamptz),
  ('RESEARCH2024B', '2025-12-31'::timestamptz),
  ('RESEARCH2024C', '2025-12-31'::timestamptz),
  ('TEAM-ALPHA', '2025-12-31'::timestamptz),
  ('TEAM-BETA', '2025-12-31'::timestamptz)
on conflict (code) do nothing;

-- ============================================
-- 预置一些常用标签
-- ============================================

insert into tags (name, category) values
  ('Python', 'skill'),
  ('机器学习', 'skill'),
  ('深度学习', 'skill'),
  ('自然语言处理', 'direction'),
  ('计算机视觉', 'direction'),
  ('数据分析', 'skill'),
  ('前端开发', 'skill'),
  ('后端开发', 'skill'),
  ('论文写作', 'skill'),
  ('数据挖掘', 'direction'),
  ('强化学习', 'direction'),
  ('大模型', 'direction'),
  ('图神经网络', 'direction'),
  ('推荐系统', 'direction'),
  ('知识图谱', 'direction'),
  ('C++', 'skill'),
  ('Java', 'skill'),
  ('PyTorch', 'skill'),
  ('TensorFlow', 'skill'),
  ('数学建模', 'skill')
on conflict (name) do nothing;
