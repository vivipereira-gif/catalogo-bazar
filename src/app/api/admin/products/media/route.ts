import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  productId: z.uuid(),
  mediaIds: z.array(z.uuid()).min(1).max(11),
});

export async function DELETE(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitação de exclusão de mídia inválida." }, { status: 400 });
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
      .select("can_upload_media, can_edit_own_products, can_edit_all_products")
      .eq("user_id", userId)
      .single(),
    admin
      .from("products")
      .select("id, created_by, status")
      .eq("id", parsed.data.productId)
      .single(),
  ]);

  const ownsEditableDraft =
    product?.created_by === userId &&
    permission?.can_edit_own_products &&
    ["draft", "rejected"].includes(product.status);
  if (
    !profile?.active ||
    !permission?.can_upload_media ||
    !product ||
    (!ownsEditableDraft && !permission.can_edit_all_products)
  ) {
    return NextResponse.json({ error: "Você não pode excluir arquivos desta peça." }, { status: 403 });
  }

  const uniqueMediaIds = [...new Set(parsed.data.mediaIds)];
  const { data: media, error: mediaError } = await admin
    .from("product_media")
    .select("id, storage_path")
    .eq("product_id", product.id)
    .in("id", uniqueMediaIds);

  if (mediaError) {
    return NextResponse.json({ error: "Não foi possível localizar as mídias selecionadas." }, { status: 500 });
  }
  if ((media ?? []).length !== uniqueMediaIds.length) {
    return NextResponse.json({ error: "Uma ou mais mídias não pertencem a esta peça." }, { status: 400 });
  }

  const { error: deleteError } = await admin
    .from("product_media")
    .delete()
    .eq("product_id", product.id)
    .in("id", uniqueMediaIds);
  if (deleteError) {
    return NextResponse.json({ error: "Não foi possível excluir as mídias da peça." }, { status: 500 });
  }

  const paths = (media ?? []).map((item) => item.storage_path);
  const { error: storageError } = await admin.storage.from("product-media").remove(paths);

  return NextResponse.json({
    deletedMediaIds: uniqueMediaIds,
    storageCleanupWarning: Boolean(storageError),
  });
}
