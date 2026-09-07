import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  productId: z.uuid(),
  kind: z.enum(["image", "video"]),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitação de upload inválida." }, { status: 400 });
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
      .select("created_by, status")
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
    (!ownsEditableDraft && !permission?.can_edit_all_products)
  ) {
    return NextResponse.json({ error: "Você não pode enviar arquivos para esta peça." }, { status: 403 });
  }

  const extension = parsed.data.kind === "image" ? "webp" : "mp4";
  const path = `${parsed.data.productId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await admin.storage
    .from("product-media")
    .createSignedUploadUrl(path, { upsert: false });

  if (error) {
    return NextResponse.json({ error: "Não foi possível autorizar o envio do arquivo." }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
