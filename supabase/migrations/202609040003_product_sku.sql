-- Código curto, legível e gerado pelo banco para identificar cada peça.
create sequence public.product_sku_seq as bigint start with 1;

alter table public.products add column sku text;

-- Preenche o acervo existente em ordem de cadastro.
with numbered_products as (
  select id, row_number() over (order by created_at, id) as sku_number
  from public.products
)
update public.products as product
set sku = 'AR-' || lpad(numbered.sku_number::text, 6, '0')
from numbered_products as numbered
where product.id = numbered.id;

select setval(
  'public.product_sku_seq',
  greatest((select count(*) from public.products), 1),
  (select count(*) > 0 from public.products)
);

alter sequence public.product_sku_seq owned by public.products.sku;
alter table public.products
  alter column sku set default ('AR-' || lpad(nextval('public.product_sku_seq')::text, 6, '0')),
  alter column sku set not null,
  add constraint products_sku_unique unique (sku),
  add constraint products_sku_format check (sku ~ '^AR-[0-9]{6,}$');

grant usage, select on sequence public.product_sku_seq to authenticated, service_role;
