-- Permite retirar temporariamente uma peça da vitrine sem tratá-la como vendida.
alter type public.product_status add value if not exists 'reserved' after 'published';

-- Uma peça reservada também pode concluir a venda pelo fluxo legado.
create or replace function public.mark_product_sold(product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.has_permission('can_publish_products') then
    raise exception 'Sem permissão para marcar peças como vendidas';
  end if;
  update public.products set status = 'sold', stock = 0
  where id = product_id and status in ('published', 'reserved');
  if not found then raise exception 'Peça não está publicada nem reservada'; end if;
end;
$$;

revoke all on function public.mark_product_sold(uuid) from public;
grant execute on function public.mark_product_sold(uuid) to authenticated;
