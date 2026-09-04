import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  productId: z.uuid(),
  action: z.enum(["archive", "delete", "publish", "reserve", "sell"]),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ação de produto inválida." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: permission }, { data: product }] = await Promise.all([
    admin.from("profiles").select("active").eq("id", userId).single(),
    admin
      .from("user_permissions")
      .select("can_edit_own_products, can_edit_all_products, can_publish_products")
      .eq("user_id", userId)
      .single(),
    admin
      .from("products")
      .select("id, created_by, status, stock")
      .eq("id", parsed.data.productId)
      .single(),
  ]);

  if (!profile?.active || !permission || !product) {
    return NextResponse.json({ error: "Produto não encontrado ou acesso suspenso." }, { status: 404 });
  }

  const ownsProduct = product.created_by === userId;
  const managesCatalog = permission.can_edit_all_products && permission.can_publish_products;
  const canDeleteDraft =
    ownsProduct &&
    permission.can_edit_own_products &&
    ["draft", "rejected"].includes(product.status);

  if (parsed.data.action === "delete" && !canDeleteDraft && !managesCatalog) {
    return NextResponse.json({ error: "Você não pode excluir esta peça." }, { status: 403 });
  }
  if (["archive", "publish", "reserve", "sell"].includes(parsed.data.action) && !managesCatalog) {
    return NextResponse.json({ error: "Você não pode alterar a publicação desta peça." }, { status: 403 });
  }

  if (parsed.data.action === "delete") {
    const { data: storedFiles, error: listError } = await admin.storage
      .from("product-media")
      .list(product.id, { limit: 100 });
    if (listError) {
      return NextResponse.json({ error: "Não foi possível localizar os arquivos da peça." }, { status: 500 });
    }

    const paths = (storedFiles ?? [])
      .filter((file) => file.id)
      .map((file) => `${product.id}/${file.name}`);
    if (paths.length) {
      const { error: storageError } = await admin.storage.from("product-media").remove(paths);
      if (storageError) {
        return NextResponse.json({ error: "Não foi possível remover os arquivos da peça." }, { status: 500 });
      }
    }

    const { error: deleteError } = await admin.from("products").delete().eq("id", product.id);
    if (deleteError) {
      return NextResponse.json({ error: "Os arquivos foram removidos, mas o cadastro não pôde ser excluído." }, { status: 500 });
    }
    return NextResponse.json({ deleted: true });
  }

  if (parsed.data.action === "publish" && product.status !== "sold" && product.stock < 1) {
    return NextResponse.json({ error: "Informe estoque maior que zero antes de publicar." }, { status: 400 });
  }

  if (parsed.data.action === "reserve" && product.status !== "published") {
    return NextResponse.json({ error: "Somente uma peça que está na vitrine pode ser reservada." }, { status: 400 });
  }

  if (parsed.data.action === "sell" && !["published", "reserved"].includes(product.status)) {
    return NextResponse.json({ error: "Somente uma peça publicada ou reservada pode ser vendida." }, { status: 400 });
  }

  const patch = parsed.data.action === "archive"
    ? { status: "hidden" as const, featured: false }
    : parsed.data.action === "reserve"
      ? { status: "reserved" as const }
      : parsed.data.action === "sell"
        ? { status: "sold" as const, stock: 0, featured: false }
        : {
        status: "published" as const,
        stock: product.status === "sold" ? 1 : product.stock,
        approved_by: userId,
        approved_at: new Date().toISOString(),
        review_note: null,
      };
  const { data: updated, error: updateError } = await admin
    .from("products")
    .update(patch)
    .eq("id", product.id)
    .select("id, status, featured, stock")
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Não foi possível atualizar a publicação da peça." }, { status: 500 });
  }
  return NextResponse.json({ product: updated });
}
