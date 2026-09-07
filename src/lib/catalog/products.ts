import "server-only";

import { cache } from "react";
import { hasSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { skuFromSlug, type CatalogProduct, type Garment } from "./types";

const garments: Record<string, Garment> = {
  Vestidos: "dress",
  Blusas: "shirt",
  Calças: "pants",
  Conjuntos: "set",
  Saias: "skirt",
  Calçados: "shoes",
  Acessórios: "bag",
  "Utilidades/Outros": "home",
};

const tones = ["rose", "sage", "cream", "blue", "lilac"];
const productSelect = "id, sku, name, description, price, size, category, subtype, stock, featured, product_media(*)";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number | string;
  size: string;
  category: string;
  subtype: string | null;
  stock: number;
  featured: boolean;
  product_media: Array<{
    id: string;
    kind: "image" | "video";
    label: string;
    storage_path: string;
    sort_order: number;
  }> | null;
};

function toneFor(sku: string) {
  const hash = [...sku].reduce((total, character) => total + character.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function mapProduct(product: ProductRow, publicUrl: (path: string) => string): CatalogProduct {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    size: product.size,
    category: product.category === "Utilidades/Outros" ? "Utilidades / Outros" : product.category,
    type: product.subtype ?? "",
    condition: "Selecionada com carinho",
    quantity: product.stock,
    garment: garments[product.subtype ?? product.category] ?? "shirt",
    tone: toneFor(product.sku),
    featured: product.featured,
    media: (product.product_media ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((media) => ({
        id: media.id,
        type: media.kind,
        label: media.label || (media.kind === "image" ? "Foto" : "Vídeo"),
        url: publicUrl(media.storage_path),
      })),
  };
}

export async function getPublishedProducts(): Promise<CatalogProduct[] | undefined> {
  if (!hasSupabasePublicConfig) return undefined;

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(productSelect)
    .eq("status", "published")
    .gt("stock", 0)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const publicUrl = (path: string) => supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
  return ((data ?? []) as ProductRow[]).map((product) => mapProduct(product, publicUrl));
}

export const getPublishedProductBySlug = cache(async (slug: string): Promise<CatalogProduct | null> => {
  const sku = skuFromSlug(slug);
  if (!hasSupabasePublicConfig || !sku) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select(productSelect)
    .eq("sku", sku)
    .eq("status", "published")
    .gt("stock", 0)
    .maybeSingle();

  if (!data) return null;
  const publicUrl = (path: string) => supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
  return mapProduct(data as ProductRow, publicUrl);
});
