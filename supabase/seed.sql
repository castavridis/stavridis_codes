-- Run this in the Supabase Dashboard → SQL Editor
-- 1. Create the table
create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text,
  cover_image_url text,
  tags            text[],
  role            text,
  year            int,
  sort_order      int default 0
);

-- 2. Allow public reads (enable RLS, then add a permissive select policy)
alter table projects enable row level security;

create policy "Public read" on projects
  for select using (true);

-- 3. Seed the 9 projects
insert into projects (name, slug, description, cover_image_url, tags, role, year, sort_order) values
  (
    'CareSignal.ai',
    'caresignal-ai',
    'A behavioral health platform connecting patients and care teams through intelligent, automated nudges at scale.',
    null,
    array['Design', 'Engineering'],
    'Lead Design Engineer',
    2023,
    1
  ),
  (
    'Sol LeWitt',
    'sol-lewitt',
    'A generative art experiment inspired by Sol LeWitt''s instruction-based wall drawings — rules produce the work.',
    null,
    array['Creative Coding', 'Engineering'],
    'Solo',
    2022,
    2
  ),
  (
    'CareSignal Design System',
    'caresignal-design-system',
    'A scalable design system — tokens, components, and documentation — powering all CareSignal products.',
    null,
    array['Design', 'Systems'],
    'Lead Designer',
    2022,
    3
  ),
  (
    'CareSignal Growth',
    'caresignal-growth',
    'Redesigned activation and onboarding flows that drove a 330% increase in conversion rates within 3 months.',
    null,
    array['Strategy', 'Design'],
    'Design Lead',
    2023,
    4
  ),
  (
    'vv',
    'vv',
    'A spatial computing experiment exploring volumetric video and real-time 3D rendering in the browser.',
    null,
    array['Engineering', 'Creative Coding'],
    'Solo',
    2024,
    5
  ),
  (
    'ISO Compliance Report',
    'iso-compliance-report',
    'An interactive annual report redesigning how compliance data is communicated to stakeholders.',
    null,
    array['Design', 'Strategy'],
    'Design Lead',
    2021,
    6
  ),
  (
    'Health Issue',
    'health-issue',
    'An editorial design project exploring mental health narratives through typographic systems and publication design.',
    null,
    array['Design', 'Brand'],
    'Art Director',
    2022,
    7
  ),
  (
    'Sandy',
    'sandy',
    'A conversational AI interface for behavioral health coaching, built mobile-first with a focus on trust and warmth.',
    null,
    array['Design', 'AI/ML'],
    'Lead Design Engineer',
    2024,
    8
  ),
  (
    'Radian',
    'radian',
    'A precision tools platform for structural engineers with a focus on data visualization and workflow clarity.',
    null,
    array['Design', 'Data Viz'],
    'Product Designer',
    2023,
    9
  );
