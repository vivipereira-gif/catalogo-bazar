import { redirect } from "next/navigation";
import { AdminDashboard } from "./admin-dashboard";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { OWNER_PERMISSIONS, type AdminProduct, type Permissions, type TeamMember } from "@/lib/admin/types";

export default async function AdminPage() {
  if (!hasSupabasePublicConfig) {
    return (
      <AdminDashboard
        demoMode
        currentUser={{ id: "viviane-demo", name: "Viviane", email: "viviane@demo.local" }}
        permissions={OWNER_PERMISSIONS}
        initialProducts={[]}
        initialTeam={[]}
      />
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/admin/login");

  const [{ data: profile }, { data: permissionData }, { data: productData }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", userId).single(),
    supabase.from("user_permissions").select("*").eq("user_id", userId).single(),
    supabase.from("products").select("*, product_media(*)").order("created_at", { ascending: false }),
  ]);

  const permissions = (permissionData ?? {}) as Permissions;
  let team: TeamMember[] = [];
  if (permissions.can_manage_users) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, active, user_permissions(*)")
      .order("created_at");
    team = (profiles ?? []).map((member) => ({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      active: member.active,
      permissions: Array.isArray(member.user_permissions)
        ? member.user_permissions[0]
        : member.user_permissions,
    })) as TeamMember[];
  }

  const products = (productData ?? []).map((product) => ({
    ...product,
    price: Number(product.price),
    product_media: (product.product_media ?? []).map((media: { storage_path: string }) => ({
      ...media,
      public_url: supabase.storage.from("product-media").getPublicUrl(media.storage_path).data.publicUrl,
    })),
  })) as AdminProduct[];

  return (
    <AdminDashboard
      currentUser={{
        id: userId,
        name: profile?.full_name || "Usuária",
        email: profile?.email || String(claimsData?.claims?.email ?? ""),
      }}
      permissions={permissions}
      initialProducts={products}
      initialTeam={team}
    />
  );
}
