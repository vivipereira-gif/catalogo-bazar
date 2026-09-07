import Catalogo from "./catalogo";
import { getPublishedProducts } from "@/lib/catalog/products";

export default async function Home() {
  const products = await getPublishedProducts();
  return <Catalogo initialProducts={products} />;
}
