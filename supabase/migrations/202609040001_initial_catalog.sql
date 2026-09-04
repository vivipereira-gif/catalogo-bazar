-- Catálogo Bazar da Ana Rebeca
-- Execute pelo Supabase CLI ou no SQL Editor de um projeto novo.

create extension if not exists pgcrypto;

create type public.product_status as enum (
  'draft', 'pending_review', 'published', 'rejected', 'sold', 'hidden'
);
create type public.media_kind as enum ('image', 'video');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_create_products boolean not null default true,
  can_edit_own_products boolean not null default true,
  can_edit_all_products boolean not null default false,
  can_upload_media boolean not null default true,
  can_submit_review boolean not null default true,
  can_review_products boolean not null default false,
  can_publish_products boolean not null default false,
  can_manage_users boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  price numeric(10,2) not null check (price >= 0),
  size text not null default 'Único' check (char_length(size) <= 40),
  category text not null check (category in ('Feminino', 'Masculino', 'Infantil', 'Acessórios', 'Utilidades/Outros')),
  subtype text,
  stock integer not null default 1 check (stock >= 0 and stock <= 999),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  created_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  review_note text check (char_length(review_note) <= 1000),
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_subtype check (
    (category = 'Feminino' and subtype in ('Vestidos', 'Blusas', 'Calças', 'Conjuntos', 'Saias', 'Calçados')) or
    (category = 'Infantil' and subtype in ('Menino', 'Menina', 'Calçados')) or
    (category in ('Masculino', 'Acessórios', 'Utilidades/Outros') and subtype is null)
  )
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind public.media_kind not null,
  storage_path text not null unique,
  label text not null default '',
  sort_order smallint not null default 0 check (sort_order between 0 and 10),
  is_cover boolean not null default false,
  mime_type text not null check (mime_type in ('image/webp', 'video/mp4')),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 6291456),
  duration_seconds numeric(5,2) check (
    (kind = 'image' and duration_seconds is null) or
    (kind = 'video' and duration_seconds > 0 and duration_seconds <= 15.05)
  ),
  width integer check (width > 0),
  height integer check (height > 0),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index one_cover_per_product
  on public.product_media(product_id) where is_cover;
create unique index one_video_per_product
  on public.product_media(product_id) where kind = 'video';
create index products_public_catalog_idx
  on public.products(status, category, subtype, featured, created_at desc);
create index products_created_by_idx on public.products(created_by, status);
create index product_media_product_idx on public.product_media(product_id, sort_order);

create schema if not exists private;

create or replace function private.has_permission(permission_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare allowed boolean;
begin
  execute format(
    'select coalesce(%I, false) from public.user_permissions where user_id = auth.uid()',
    permission_name
  ) into allowed;
  return coalesce(allowed, false);
exception when undefined_column then
  return false;
end;
$$;

revoke all on function private.has_permission(text) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_permission(text) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger permissions_updated_at before update on public.user_permissions
for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create or replace function public.enforce_product_media_limit()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.kind = 'image' and (
    select count(*) from public.product_media
    where product_id = new.product_id and kind = 'image' and id <> new.id
  ) >= 10 then
    raise exception 'Cada peça aceita no máximo 10 fotos';
  end if;
  return new;
end;
$$;

create trigger product_media_limit
before insert or update on public.product_media
for each row execute function public.enforce_product_media_limit();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  );
  insert into public.user_permissions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_permissions enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;

-- A vitrine só enxerga itens publicados com estoque.
create policy "public reads available catalog" on public.products
for select using (status = 'published' and stock > 0);
create policy "team reads workable products" on public.products
for select to authenticated using (
  created_by = auth.uid() or private.has_permission('can_edit_all_products') or
  private.has_permission('can_review_products')
);
create policy "team creates drafts" on public.products
for insert to authenticated with check (
  created_by = auth.uid() and status = 'draft' and private.has_permission('can_create_products')
);
create policy "team edits own drafts" on public.products
for update to authenticated using (
  created_by = auth.uid() and status in ('draft', 'rejected') and
  private.has_permission('can_edit_own_products')
) with check (
  created_by = auth.uid() and status in ('draft', 'rejected') and
  private.has_permission('can_edit_own_products')
);
create policy "managers edit all products" on public.products
for update to authenticated using (private.has_permission('can_edit_all_products'))
with check (private.has_permission('can_edit_all_products'));
create policy "team removes own drafts" on public.products
for delete to authenticated using (
  created_by = auth.uid() and status in ('draft', 'rejected') and
  private.has_permission('can_edit_own_products')
);

create policy "public reads media of public products" on public.product_media
for select using (exists (
  select 1 from public.products p
  where p.id = product_id and p.status = 'published' and p.stock > 0
));
create policy "team reads product media" on public.product_media
for select to authenticated using (exists (
  select 1 from public.products p where p.id = product_id and (
    p.created_by = auth.uid() or private.has_permission('can_edit_all_products') or
    private.has_permission('can_review_products')
  )
));
create policy "team adds product media" on public.product_media
for insert to authenticated with check (
  created_by = auth.uid() and private.has_permission('can_upload_media') and exists (
    select 1 from public.products p where p.id = product_id and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
);
create policy "team changes product media" on public.product_media
for update to authenticated using (exists (
  select 1 from public.products p where p.id = product_id and (
    (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
    private.has_permission('can_edit_all_products')
  )
)) with check (
  private.has_permission('can_upload_media') and exists (
    select 1 from public.products p where p.id = product_id and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
);
create policy "team removes product media" on public.product_media
for delete to authenticated using (exists (
  select 1 from public.products p where p.id = product_id and (
    (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
    private.has_permission('can_edit_all_products')
  )
));

create policy "users read own profile" on public.profiles
for select to authenticated using (
  id = auth.uid() or private.has_permission('can_manage_users')
);
create policy "users edit own profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "managers update profiles" on public.profiles
for update to authenticated using (private.has_permission('can_manage_users'))
with check (private.has_permission('can_manage_users'));
create policy "users read own permissions" on public.user_permissions
for select to authenticated using (
  user_id = auth.uid() or private.has_permission('can_manage_users')
);
create policy "managers set permissions" on public.user_permissions
for update to authenticated using (private.has_permission('can_manage_users'))
with check (private.has_permission('can_manage_users'));

grant select on public.products, public.product_media to anon;
grant select, insert, update, delete on public.products, public.product_media to authenticated;
grant select, update on public.profiles, public.user_permissions to authenticated;

create or replace function public.submit_product_for_review(product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_permission('can_submit_review') then
    raise exception 'Sem permissão para enviar para aprovação';
  end if;
  update public.products
  set status = 'pending_review', submitted_at = now(), review_note = null
  where id = product_id and created_by = auth.uid() and status in ('draft', 'rejected');
  if not found then raise exception 'Peça não encontrada ou indisponível para envio'; end if;
end;
$$;

create or replace function public.review_product(product_id uuid, approve boolean, note text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_permission('can_review_products') then
    raise exception 'Sem permissão para revisar peças';
  end if;
  update public.products
  set status = case when approve then 'published'::public.product_status else 'rejected'::public.product_status end,
      approved_by = case when approve then auth.uid() else null end,
      approved_at = case when approve then now() else null end,
      review_note = nullif(trim(note), '')
  where id = product_id and status = 'pending_review';
  if not found then raise exception 'Peça não está aguardando aprovação'; end if;
end;
$$;

create or replace function public.mark_product_sold(product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_permission('can_publish_products') then
    raise exception 'Sem permissão para marcar peças como vendidas';
  end if;
  update public.products set status = 'sold', stock = 0
  where id = product_id and status = 'published';
  if not found then raise exception 'Peça não está publicada'; end if;
end;
$$;

revoke all on function public.submit_product_for_review(uuid) from public;
revoke all on function public.review_product(uuid, boolean, text) from public;
revoke all on function public.mark_product_sold(uuid) from public;
grant execute on function public.submit_product_for_review(uuid) to authenticated;
grant execute on function public.review_product(uuid, boolean, text) to authenticated;
grant execute on function public.mark_product_sold(uuid) to authenticated;

-- Arquivos já chegam otimizados. O limite do bucket impede uploads acidentais maiores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 6291456, array['image/webp', 'video/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads catalog files" on storage.objects
for select using (bucket_id = 'product-media');
create policy "team uploads catalog files" on storage.objects
for insert to authenticated with check (
  bucket_id = 'product-media' and private.has_permission('can_upload_media') and
  exists (
    select 1 from public.products p
    where p.id::text = (storage.foldername(name))[1] and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
);
create policy "team updates catalog files" on storage.objects
for update to authenticated using (
  bucket_id = 'product-media' and private.has_permission('can_upload_media') and
  exists (
    select 1 from public.products p
    where p.id::text = (storage.foldername(name))[1] and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
) with check (
  bucket_id = 'product-media' and private.has_permission('can_upload_media') and
  exists (
    select 1 from public.products p
    where p.id::text = (storage.foldername(name))[1] and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
);
create policy "team deletes catalog files" on storage.objects
for delete to authenticated using (
  bucket_id = 'product-media' and private.has_permission('can_upload_media') and
  exists (
    select 1 from public.products p
    where p.id::text = (storage.foldername(name))[1] and (
      (p.created_by = auth.uid() and p.status in ('draft', 'rejected')) or
      private.has_permission('can_edit_all_products')
    )
  )
);

-- Depois de criar a conta da Viviane, promova-a uma única vez no SQL Editor:
-- update public.user_permissions set
--   can_edit_all_products = true, can_review_products = true,
--   can_publish_products = true, can_manage_users = true
-- where user_id = (select id from auth.users where email = 'EMAIL_DA_VIVIANE');
