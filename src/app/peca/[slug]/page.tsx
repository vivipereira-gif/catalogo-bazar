import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedProductBySlug } from "@/lib/catalog/products";
import { currency, getProductMedia, productSlug } from "@/lib/catalog/types";
import { SHARE_IMAGE } from "@/lib/media/constants";
import ProductDetails from "@/app/product-details";

export async function generateMetadata({ params }: PageProps<"/peca/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return { title: "Peça não encontrada | Bazar da Ana Rebeca" };

  const image = product.shareImageUrl
    ?? getProductMedia(product).find((media) => media.type === "image" && media.url)?.url;
  const productDescription = product.description.replace(/\s+/g, " ").trim();
  const description = `Tamanho: ${product.size} · Valor: ${currency.format(product.price)}.${productDescription ? ` ${productDescription}` : ""}`.slice(0, 220);
  const canonicalPath = `/peca/${productSlug(product)}`;

  return {
    title: `${product.name} | Bazar da Ana Rebeca`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: product.name,
      description,
      url: canonicalPath,
      siteName: "Bazar da Ana Rebeca",
      locale: "pt_BR",
      type: "website",
      ...(image ? { images: [{
        url: image,
        width: SHARE_IMAGE.width,
        height: SHARE_IMAGE.height,
        type: SHARE_IMAGE.contentType,
        alt: product.name,
      }] } : {}),
    },
    ...(image ? { twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [{ url: image, alt: product.name }],
    } } : {}),
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
