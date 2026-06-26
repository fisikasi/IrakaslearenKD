create type app_role as enum ('teacher', 'tutor');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role app_role not null default 'teacher',
  created_at timestamptz not null default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  subject text not null,
  level text,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  surname text not null default '',
  name text not null default '',
  created_at timestamptz not null default now()
);

create table competencies (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  code text not null,
  title text,
  weight numeric not null default 0
);

create table criteria (
  id uuid primary key default gen_random_uuid(),
  competency_id uuid not null references competencies(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  code text not null,
  title text,
  weight numeric not null default 0
);

create table assessment_tools (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  assessment_tool_id uuid not null references assessment_tools(id) on delete cascade,
  criterion_id uuid not null references criteria(id) on delete cascade,
  value numeric,
  unique(student_id, assessment_tool_id, criterion_id)
);

alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table competencies enable row level security;
alter table criteria enable row level security;
alter table assessment_tools enable row level security;
alter table grades enable row level security;

create policy "own profile" on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own classes" on classes for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "own students" on students for all using (exists (select 1 from classes c where c.id = students.class_id and c.teacher_id = auth.uid())) with check (exists (select 1 from classes c where c.id = students.class_id and c.teacher_id = auth.uid()));
create policy "own competencies" on competencies for all using (exists (select 1 from classes c where c.id = competencies.class_id and c.teacher_id = auth.uid())) with check (exists (select 1 from classes c where c.id = competencies.class_id and c.teacher_id = auth.uid()));
create policy "own criteria" on criteria for all using (exists (select 1 from classes c where c.id = criteria.class_id and c.teacher_id = auth.uid())) with check (exists (select 1 from classes c where c.id = criteria.class_id and c.teacher_id = auth.uid()));
create policy "own assessment tools" on assessment_tools for all using (exists (select 1 from classes c where c.id = assessment_tools.class_id and c.teacher_id = auth.uid())) with check (exists (select 1 from classes c where c.id = assessment_tools.class_id and c.teacher_id = auth.uid()));
create policy "own grades" on grades for all using (exists (select 1 from students s join classes c on c.id = s.class_id where s.id = grades.student_id and c.teacher_id = auth.uid())) with check (exists (select 1 from students s join classes c on c.id = s.class_id where s.id = grades.student_id and c.teacher_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 'teacher');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function duplicate_class_structure(source_class_id uuid, new_class_name text)
returns uuid language plpgsql security definer as $$
declare
  new_class_id uuid;
  old_comp record;
  new_comp_id uuid;
begin
  insert into classes (teacher_id, name, subject, level)
  select auth.uid(), new_class_name, subject, level from classes
  where id = source_class_id and teacher_id = auth.uid()
  returning id into new_class_id;

  for old_comp in select * from competencies where class_id = source_class_id loop
    insert into competencies (class_id, code, title, weight)
    values (new_class_id, old_comp.code, old_comp.title, old_comp.weight)
    returning id into new_comp_id;

    insert into criteria (class_id, competency_id, code, title, weight)
    select new_class_id, new_comp_id, code, title, weight
    from criteria where competency_id = old_comp.id;
  end loop;

  insert into assessment_tools (class_id, name)
  select new_class_id, name from assessment_tools where class_id = source_class_id;

  return new_class_id;
end;
$$;
