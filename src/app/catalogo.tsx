"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { currency, getProductMedia, productSlug, type CatalogProduct } from "@/lib/catalog/types";
import { useCart } from "./cart-context";
import { GarmentIllustration, ProductVisual } from "./product-visual";
import styles from "./catalogo.module.css";

type Product = CatalogProduct;

const WHATSAPP_NUMBER = "5535991923321";
const ALL = "Todos";

const catalogStructure: Record<string, string[]> = {
  Todas: [],
  Feminino: ["Vestidos", "Blusas", "Calças", "Conjuntos", "Saias", "Calçados"],
  Masculino: [],
  Infantil: ["Menino", "Menina", "Calçados"],
  Acessórios: [],
  "Utilidades / Outros": [],
};

const demoProducts: Product[] = ([
  {
    id: 1,
    name: "Vestido floral rosé",
    price: 48,
    size: "M",
    category: "Feminino",
    type: "Vestidos",
    condition: "Como novo",
    quantity: 1,
    garment: "dress",
    tone: "rose",
    featured: true,
    media: [
      { id: "vestido-frente", type: "image", label: "Frente", view: "front" },
      { id: "vestido-costas", type: "image", label: "Costas", view: "back" },
      { id: "vestido-detalhe", type: "image", label: "Detalhes", view: "detail" },
      { id: "vestido-video", type: "video", label: "Vídeo", view: "front" },
    ],
    description:
      "Vestido leve, acinturado e com caimento soltinho. Busto 92 cm, cintura 78 cm e comprimento 105 cm. Cor rosé com estampa floral delicada.",
  },
  {
    id: 2,
    name: "Camisa de linho",
    price: 42,
    size: "G",
    category: "Feminino",
    type: "Blusas",
    condition: "Excelente",
    quantity: 1,
    garment: "shirt",
    tone: "cream",
    featured: false,
    description:
      "Camisa de linho com modelagem ampla. Ombro 42 cm, busto 108 cm e comprimento 68 cm. Tom areia, tecido fresco e sem avarias.",
  },
  {
    id: 3,
    name: "Calça pantalona",
    price: 55,
    size: "40",
    category: "Feminino",
    type: "Calças",
    condition: "Muito bom",
    quantity: 1,
    garment: "pants",
    tone: "wine",
    featured: false,
    description:
      "Pantalona de cintura alta, tecido encorpado e fluido. Cintura 82 cm, quadril 108 cm e comprimento 108 cm. Cor vinho.",
  },
  {
    id: 4,
    name: "Conjunto verde sálvia",
    price: 69,
    size: "M",
    category: "Feminino",
    type: "Conjuntos",
    condition: "Como novo",
    quantity: 1,
    garment: "set",
    tone: "sage",
    featured: true,
    media: [
      { id: "conjunto-frente", type: "image", label: "Frente", view: "front" },
      { id: "conjunto-costas", type: "image", label: "Costas", view: "back" },
      { id: "conjunto-video", type: "video", label: "Vídeo", view: "front" },
    ],
    description:
      "Conjunto de blusa e saia midi em viscose. Blusa com 96 cm de busto; saia com 76 cm de cintura e 84 cm de comprimento.",
  },
  {
    id: 5,
    name: "Cardigan de tricô",
    price: 45,
    size: "U",
    category: "Feminino",
    type: "Blusas",
    condition: "Excelente",
    quantity: 1,
    garment: "cardigan",
    tone: "lilac",
    featured: false,
    description:
      "Cardigan macio com botões perolados. Veste do P ao G, com 60 cm de comprimento. Lilás suave, sem bolinhas ou fios puxados.",
  },
  {
    id: 6,
    name: "Saia midi plissada",
    price: 38,
    size: "M",
    category: "Feminino",
    type: "Saias",
    condition: "Muito bom",
    quantity: 2,
    garment: "skirt",
    tone: "blue",
    featured: false,
    description:
      "Saia midi plissada com elástico confortável. Cintura de 72 a 88 cm e comprimento 82 cm. Azul acinzentado.",
  },
  {
    id: 7,
    name: "Sandália de tiras",
    price: 32,
    size: "37",
    category: "Feminino",
    type: "Calçados",
    condition: "Muito bom",
    quantity: 1,
    garment: "shoes",
    tone: "sand",
    featured: false,
    description:
      "Sandália caramelo de salto baixo, número 37. Palmilha de 24,5 cm e sinais discretos de uso na sola.",
  },
  {
    id: 8,
    name: "Camiseta masculina",
    price: 25,
    size: "G",
    category: "Masculino",
    type: "",
    condition: "Excelente",
    quantity: 1,
    garment: "shirt",
    tone: "blue",
    featured: true,
    media: [
      { id: "camiseta-frente", type: "image", label: "Frente", view: "front" },
      { id: "camiseta-costas", type: "image", label: "Costas", view: "back" },
    ],
    description:
      "Camiseta masculina de algodão, tamanho G. Peito 108 cm e comprimento 72 cm. Azul acinzentado, sem manchas.",
  },
  {
    id: 9,
    name: "Vestido infantil alegre",
    price: 30,
    size: "6 anos",
    category: "Infantil",
    type: "Menina",
    condition: "Como novo",
    quantity: 1,
    garment: "dress",
    tone: "lilac",
    featured: false,
    description:
      "Vestido infantil tamanho 6 anos, com forro leve. Peito 64 cm e comprimento 62 cm. Estampa delicada em tons lilás.",
  },
  {
    id: 10,
    name: "Conjunto infantil casual",
    price: 35,
    size: "4 anos",
    category: "Infantil",
    type: "Menino",
    condition: "Excelente",
    quantity: 1,
    garment: "set",
    tone: "sage",
    featured: false,
    description:
      "Conjunto infantil tamanho 4 anos com camiseta e bermuda. Algodão macio, verde sálvia, sem avarias.",
  },
  {
    id: 11,
    name: "Tênis infantil",
    price: 40,
    size: "28",
    category: "Infantil",
    type: "Calçados",
    condition: "Muito bom",
    quantity: 1,
    garment: "shoes",
    tone: "rose",
    featured: false,
    description:
      "Tênis infantil número 28, palmilha de 18,5 cm. Fechamento em velcro e sola em ótimo estado.",
  },
  {
    id: 12,
    name: "Bolsa de palha",
    price: 28,
    size: "U",
    category: "Acessórios",
    type: "",
    condition: "Excelente",
    quantity: 1,
    garment: "bag",
    tone: "sand",
    featured: true,
    media: [
      { id: "bolsa-frente", type: "image", label: "Frente", view: "front" },
      { id: "bolsa-detalhe", type: "image", label: "Interior", view: "detail" },
    ],
    description:
      "Bolsa de palha com forro e fechamento interno. Mede 32 × 24 cm e possui alça estruturada em ótimo estado.",
  },
  {
    id: 13,
    name: "Cesto organizador",
    price: 10,
    size: "U",
    category: "Utilidades / Outros",
    type: "",
    condition: "Muito bom",
    quantity: 3,
    garment: "home",
    tone: "cream",
    featured: false,
    description:
      "Cesto organizador em fibra, com 24 cm de diâmetro e 16 cm de altura. Ideal para pequenos objetos ou decoração.",
  },
] satisfies Array<Omit<Product, "sku">>).map((product, index) => ({ ...product, sku: `AR-${String(index + 1).padStart(6, "0")}` }));

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  showFeatured?: boolean;
  onFavorite: (id: string | number) => void;
  onAdd: (product: Product) => void;
};

function ProductCard({ product, isFavorite, showFeatured, onFavorite, onAdd }: ProductCardProps) {
  const href = `/peca/${productSlug(product)}`;
  return (
    <article className={styles.productCard}>
      <Link className={styles.imageButton} href={href} scroll={false} aria-label={`Ver detalhes de ${product.name}`}>
        <ProductVisual product={product} media={getProductMedia(product).find((item) => item.type === "image")} />
      </Link>
      {showFeatured && <span className={styles.featuredBadge}><Sparkles size={12} /> Destaque</span>}
      {getProductMedia(product).length > 1 && <span className={styles.mediaCount}>{getProductMedia(product).length} mídias</span>}
      <button className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ""}`} type="button" onClick={() => onFavorite(product.id)} aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <div className={styles.productInfo}>
        <div className={styles.productMeta}>
          <span>{product.type || product.category}</span>
          <span>Tam. {product.size}</span>
        </div>
        <Link className={styles.productTitle} href={href} scroll={false}>{product.name}</Link>
        <div className={styles.productFooter}>
          <strong>{currency.format(product.price)}</strong>
          <button type="button" onClick={() => onAdd(product)} aria-label={`Adicionar ${product.name} à sacola`}><Plus size={19} /></button>
        </div>
        {product.quantity > 1 && <small>{product.quantity} unidades disponíveis</small>}
      </div>
    </article>
  );
}

export default function Catalogo({ initialProducts }: { initialProducts?: Product[] }) {
  const products = useMemo(
    () => initialProducts === undefined ? demoProducts : initialProducts,
    [initialProducts],
  );
  const [category, setCategory] = useState("Todas");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [sizeFilter, setSizeFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const { cart, addToCart, changeQuantity } = useCart();
  const [favorites, setFavorites] = useState<Array<string | number>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const availableTypes = catalogStructure[category] ?? [];
  const availableSizes = useMemo(() => {
    const sizes = products
      .filter((product) => category === "Todas" || product.category === category)
      .filter((product) => typeFilter === ALL || product.type === typeFilter)
      .map((product) => product.size);
    return [...new Set(sizes)].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  }, [category, typeFilter, products]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const inCategory = category === "Todas" || product.category === category;
      const inType = typeFilter === ALL || product.type === typeFilter;
      const inSize = sizeFilter === ALL || product.size === sizeFilter;
      const searchable = `${product.sku} ${product.name} ${product.category} ${product.type} ${product.size} ${product.description}`.toLocaleLowerCase("pt-BR");
      return inCategory && inType && inSize && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [category, typeFilter, sizeFilter, search, products]);

  const featuredProducts = products.filter((product) => product.featured);
  const activeFilterCount = Number(category !== "Todas") + Number(typeFilter !== ALL) + Number(sizeFilter !== ALL) + Number(Boolean(search.trim()));
  const cartCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setTypeFilter(ALL);
    setSizeFilter(ALL);
  }

  function clearFilters() {
    setCategory("Todas");
    setTypeFilter(ALL);
    setSizeFilter(ALL);
    setSearch("");
  }

  function toggleFavorite(id: string | number) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function openCart() {
    setCartOpen(true);
  }

  function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const items = cart.map((item) => `• ${item.cartQuantity}x [${item.sku}] ${item.name} — tam. ${item.size} — ${currency.format(item.price * item.cartQuantity)}`).join("\n");
    const message = [
      "Olá, Viviane! Gostaria de consultar a disponibilidade destas peças:", "", items, "",
      `Total: ${currency.format(total)}`, "", `Nome: ${data.get("name")}`,
      `Telefone: ${data.get("phone")}`, `Endereço: ${data.get("address")}`, "",
      "Sei que o envio desta mensagem não reserva as peças e aguardo sua confirmação. 😊",
    ].join("\n");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={styles.siteShell}>
      <div className={styles.notice}><Sparkles size={14} aria-hidden="true" /><span>Peças únicas, escolhidas com carinho</span></div>

      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="Bazar da Ana Rebeca — início"><span className={styles.brandMark}>AR</span><span><strong>Bazar</strong><small>da Ana Rebeca</small></span></a>
        <nav className={styles.desktopNav} aria-label="Navegação principal"><a href="#destaques">Destaques</a><a href="#catalogo">Catálogo</a><a href="#como-funciona">Como funciona</a></nav>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} type="button" aria-label="Abrir busca" onClick={() => document.getElementById("busca")?.focus()}><Search size={20} /></button>
          <button className={styles.bagButton} type="button" onClick={openCart} aria-label={`Abrir sacola com ${cartCount} itens`}><ShoppingBag size={20} /><span>Sacola</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
          <button className={styles.mobileMenu} type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu">{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && <nav className={styles.mobileNav} aria-label="Navegação para celular"><a href="#destaques" onClick={() => setMenuOpen(false)}>Destaques</a><a href="#catalogo" onClick={() => setMenuOpen(false)}>Catálogo</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a></nav>}
      </header>

      <main id="inicio">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Nova seleção da semana</span>
            <h1>Peças lindas merecem <em>novas histórias.</em></h1>
            <p>Uma curadoria feita com afeto, preços gentis e achadinhos para toda a família e para a casa.</p>
            <a className={styles.primaryButton} href="#catalogo">Ver peças disponíveis <ArrowRight size={18} /></a>
            <div className={styles.heroNotes}><span><Check size={15} /> Peças bem cuidadas</span><span><Check size={15} /> Compra pelo WhatsApp</span></div>
          </div>
          <div className={styles.heroArt} aria-hidden="true"><div className={styles.heroArch}><Image className={styles.heroImage} src="/hero-bazar-editorial.png" alt="" fill preload sizes="(max-width: 600px) 285px, (max-width: 1080px) 39vw, 400px" /><div className={styles.heroFlower}>✦</div><span className={styles.heroTag}><b>A partir de</b><strong>R$ 10</strong></span></div></div>
        </section>

        <section className={styles.featuredSection} id="destaques">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Escolhas da Viviane</span><h2>Peças em destaque</h2></div><p>Uma seleção especial para você</p></div>
          <div className={styles.featuredGrid}>
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} isFavorite={favorites.includes(product.id)} showFeatured onFavorite={toggleFavorite} onAdd={addToCart} />)}
          </div>
        </section>

        <section className={styles.catalog} id="catalogo">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Todos os garimpos</span><h2>Encontre a sua favorita</h2></div><p>{visibleProducts.length} {visibleProducts.length === 1 ? "peça encontrada" : "peças encontradas"}</p></div>
          <div className={styles.filterPanel}>
            <div className={styles.filterTitle}><span><SlidersHorizontal size={17} /> Filtrar peças</span>{activeFilterCount > 0 && <button type="button" onClick={clearFilters}>Limpar filtros ({activeFilterCount})</button>}</div>
            <div className={styles.categories} role="group" aria-label="Filtrar por categoria">
              {Object.keys(catalogStructure).map((item) => <button key={item} type="button" className={category === item ? styles.activeCategory : ""} onClick={() => selectCategory(item)}>{item}</button>)}
            </div>
            <div className={styles.filterControls}>
              <label className={styles.searchBox}><span>Buscar</span><div><Search size={18} aria-hidden="true" /><input id="busca" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, código, cor ou medida" aria-label="Buscar no catálogo" /></div></label>
              <label><span>Tipo</span><select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setSizeFilter(ALL); }} disabled={availableTypes.length === 0}><option value={ALL}>{availableTypes.length > 0 ? "Todos os tipos" : category === "Todas" ? "Escolha uma categoria" : "Não se aplica"}</option>{availableTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label><span>Tamanho</span><select value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value)}><option value={ALL}>Todos os tamanhos</option>{availableSizes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            </div>
          </div>

          {visibleProducts.length > 0 ? (
            <div className={styles.productGrid}>{visibleProducts.map((product) => <ProductCard key={product.id} product={product} isFavorite={favorites.includes(product.id)} onFavorite={toggleFavorite} onAdd={addToCart} />)}</div>
          ) : (
            <div className={styles.emptySearch}><Search size={28} /><h3>Nenhuma peça por aqui</h3><p>Tente buscar outro nome, tamanho, tipo ou categoria.</p><button type="button" onClick={clearFilters}>Limpar filtros</button></div>
          )}
        </section>

        <section className={styles.howItWorks} id="como-funciona">
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>Simples e pertinho</span><h2>Como comprar</h2></div></div>
          <div className={styles.steps}><article><span>01</span><ShoppingBag size={24} /><h3>Escolha suas peças</h3><p>Adicione à sacola tudo o que você gostou.</p></article><article><span>02</span><MessageIcon /><h3>Envie seu pedido</h3><p>Seus dados e a lista seguem prontos para a Viviane.</p></article><article><span>03</span><PackageCheck size={24} /><h3>Combine os detalhes</h3><p>Disponibilidade, pagamento e entrega são confirmados no WhatsApp.</p></article></div>
          <p className={styles.availabilityNote}>O envio do pedido não reserva automaticamente as peças. A disponibilidade será confirmada pela Viviane no WhatsApp.</p>
        </section>
      </main>

      <footer className={styles.footer}><a className={styles.brand} href="#inicio"><span className={styles.brandMark}>AR</span><span><strong>Bazar</strong><small>da Ana Rebeca</small></span></a><p>Uma nova história para cada peça. ♡</p><span className={styles.footerNote}>Feminino · Masculino · Infantil · Casa</span></footer>

      {cartCount > 0 && !cartOpen && <button className={styles.floatingCart} type="button" onClick={openCart}><span><ShoppingBag size={19} /><b>{cartCount}</b> {cartCount === 1 ? "peça" : "peças"}</span><strong>Ver reservas · {currency.format(total)}</strong></button>}

      {cartOpen && <div className={styles.overlay} role="presentation" onMouseDown={() => setCartOpen(false)}><aside className={styles.cartDrawer} role="dialog" aria-modal="true" aria-labelledby="cart-title" onMouseDown={(event) => event.stopPropagation()}><header className={styles.drawerHeader}><div><span className={styles.eyebrow}>Seu garimpo</span><h2 id="cart-title">Minhas reservas <small>({cartCount})</small></h2></div><button type="button" onClick={() => setCartOpen(false)} aria-label="Fechar sacola"><X size={22} /></button></header>
        {cart.length === 0 ? <div className={styles.emptyCart}><span><ShoppingBag size={28} /></span><h3>Sua sacola está vazia</h3><p>Que tal conhecer os garimpos desta semana?</p><button className={styles.primaryButton} type="button" onClick={() => setCartOpen(false)}>Ver catálogo</button></div> : checkoutOpen ? <form className={styles.checkoutForm} onSubmit={handleCheckout}><button className={styles.backButton} type="button" onClick={() => setCheckoutOpen(false)}><ArrowLeft size={17} /> Voltar para a sacola</button><div><h3>Seus dados</h3><p>Eles serão enviados somente para a Viviane pelo WhatsApp.</p></div><label>Nome completo<input name="name" required autoComplete="name" placeholder="Como podemos te chamar?" /></label><label>Telefone<input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="(35) 99999-9999" /></label><label>Endereço<textarea name="address" required autoComplete="street-address" rows={3} placeholder="Rua, número, bairro e cidade" /></label><div className={styles.orderSummary}><span>Total do pedido</span><strong>{currency.format(total)}</strong></div><button className={styles.whatsappButton} type="submit"><MessageIcon /> Enviar pedido pelo WhatsApp</button><small className={styles.formNote}>A disponibilidade e a forma de entrega ou retirada serão combinadas diretamente com a Viviane.</small></form> : <><div className={styles.cartItems}>{cart.map((item) => <article className={styles.cartItem} key={item.id}><div className={styles.cartThumb}><GarmentIllustration product={item} /></div><div className={styles.cartItemInfo}><div><h3>{item.name}</h3><p>{item.sku} · Tam. {item.size} · {item.condition}</p></div><div className={styles.cartControls}><span><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="Diminuir quantidade">{item.cartQuantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}</button><b>{item.cartQuantity}</b><button type="button" onClick={() => changeQuantity(item.id, 1)} disabled={item.cartQuantity >= item.quantity} aria-label="Aumentar quantidade"><Plus size={14} /></button></span><strong>{currency.format(item.price * item.cartQuantity)}</strong></div></div></article>)}</div><div className={styles.cartFooter}><div><span>Total</span><strong>{currency.format(total)}</strong></div><button className={styles.primaryButton} type="button" onClick={() => setCheckoutOpen(true)}>Continuar <ArrowRight size={18} /></button><small>Você ainda não está reservando as peças.</small></div></>}
      </aside></div>}

    </div>
  );
}

function MessageIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.3L3 20.2l1.4-4.9a8.4 8.4 0 1 1 16.1-3.7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8.2 7.8c.4-.4.8-.2 1 .2l.8 1.8c.2.4-.1.7-.5 1 .7 1.4 1.8 2.5 3.3 3.2.3-.4.7-.8 1-.6l1.8.8c.4.2.6.6.2 1-1 1.1-2.3 1.3-3.6.8-2.9-1.1-5.3-3.5-6.4-6.4-.5-1.3-.2-2.7 1-3.5" fill="currentColor"/></svg>;
}
