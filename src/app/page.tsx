import Catalogo, { type CatalogProduct } from "./catalogo";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const garments: Record<string, CatalogProduct["garment"]> = {
  Vestidos: "dress", Blusas: "shirt", Calças: "pants", Conjuntos: "set",
  Saias: "skirt", Calçados: "shoes", Acessórios: "bag", "Utilidades/Outros": "home",
};

export default async function Home() {
  if (!hasSupabasePublicConfig) return <Catalogo />;

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, description, price, size, category, subtype, stock, featured, product_media(*)")
    .eq("status", "published")
    .gt("stock", 0)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const products: CatalogProduct[] = (data ?? []).map((product, index) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    size: product.size,
    category: product.category === "Utilidades/Outros" ? "Utilidades / Outros" : product.category,
    type: product.subtype ?? "",
    condition: "Selecionada com carinho",
    quantity: product.stock,
    garment: garments[product.subtype ?? product.category] ?? "shirt",
    tone: ["rose", "sage", "cream", "blue", "lilac"][index % 5],
    featured: product.featured,
    media: (product.product_media ?? [])
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((media: { id: string; kind: "image" | "video"; label: string; storage_path: string }) => ({
        id: media.id,
        type: media.kind,
        label: media.label || (media.kind === "image" ? "Foto" : "Vídeo"),
        url: supabase.storage.from("product-media").getPublicUrl(media.storage_path).data.publicUrl,
      })),
  }));

  return <Catalogo initialProducts={products} />;
}
