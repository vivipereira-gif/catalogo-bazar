export type Garment =
  | "dress"
  | "shirt"
  | "pants"
  | "set"
  | "cardigan"
  | "skirt"
  | "shoes"
  | "bag"
  | "home";

export type ProductMedia = {
  id: string;
  type: "image" | "video";
  label: string;
  view?: "front" | "back" | "detail";
  url?: string;
};

export type CatalogProduct = {
  id: string | number;
  sku: string;
  name: string;
  price: number;
  size: string;
  category: string;
  type: string;
  condition: string;
  quantity: number;
  garment: Garment;
  tone: string;
  description: string;
  featured: boolean;
  media?: ProductMedia[];
};

export type CartItem = CatalogProduct & { cartQuantity: number };

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function getProductMedia(product: CatalogProduct): ProductMedia[] {
  return product.media ?? [
    { id: `${product.id}-capa`, type: "image", label: "Frente", view: "front" },
  ];
}

export function productSlug(product: Pick<CatalogProduct, "name" | "sku">) {
  const name = product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${name || "peca"}-${product.sku.toLowerCase()}`;
}

export function skuFromSlug(slug: string) {
  return slug.match(/(?:^|-)(ar-\d{6,})$/i)?.[1].toUpperCase() ?? null;
}
