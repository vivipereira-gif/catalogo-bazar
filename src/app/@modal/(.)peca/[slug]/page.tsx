import { notFound } from "next/navigation";
import { getPublishedProductBySlug } from "@/lib/catalog/products";
import ProductDetails from "@/app/product-details";

export default async function ProductModal({ params }: PageProps<"/peca/[slug]">) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetails product={product} modal />;
}
