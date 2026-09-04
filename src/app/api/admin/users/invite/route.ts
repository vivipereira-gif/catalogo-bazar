import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email(),
  permissions: z.object({
    can_create_products: z.boolean(),
    can_edit_own_products: z.boolean(),
    can_edit_all_products: z.boolean(),
    can_upload_media: z.boolean(),
    can_submit_review: z.boolean(),
    can_review_products: z.boolean(),
    can_publish_products: z.boolean(),
    can_manage_users: z.boolean(),
  }),
});

export async function POST(request: Request) {
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dados do convite inválidos." }, { status: 400 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });

  const { data: permission } = await supabase
    .from("user_permissions")
    .select("can_manage_users")
    .eq("user_id", userId)
    .single();
  if (!permission?.can_manage_users) {
    return NextResponse.json({ error: "Você não pode gerenciar usuários." }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${siteUrl}/auth/callback?next=/admin/definir-senha`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const invitedId = data.user.id;
    await admin.from("profiles").upsert({
      id: invitedId,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      active: true,
    });
    const { error: permissionError } = await admin.from("user_permissions").upsert({
      user_id: invitedId,
      ...parsed.data.permissions,
    });
    if (permissionError) throw permissionError;

    return NextResponse.json({
      member: {
        id: invitedId,
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        active: true,
        permissions: parsed.data.permissions,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar o convite." },
      { status: 500 },
    );
  }
}
