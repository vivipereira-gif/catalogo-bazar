import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedProductBySlug } from "@/lib/catalog/products";
import { getProductMedia, productSlug } from "@/lib/catalog/types";
import ProductDetails from "@/app/product-details";

export async function generateMetadata({ params }: PageProps<"/peca/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return { title: "Peça não encontrada | Bazar da Ana Rebeca" };

  const image = getProductMedia(product).find((media) => media.type === "image" && media.url)?.url;
  const fallbackDescription = `${product.name}, tamanho ${product.size}, por ${product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`;
  const description = (product.description || fallbackDescription).replace(/\s+/g, " ").trim().slice(0, 220);

  return {
    title: `${product.name} | Bazar da Ana Rebeca`,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/peca/[slug]">) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const canonicalSlug = productSlug(product);
  if (slug !== canonicalSlug) permanentRedirect(`/peca/${canonicalSlug}`);

  return <ProductDetails product={product} />;
}
