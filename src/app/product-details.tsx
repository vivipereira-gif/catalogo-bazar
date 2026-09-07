"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Share2, ShoppingBag, X } from "lucide-react";
import { currency, getProductMedia, type CatalogProduct } from "@/lib/catalog/types";
import { useCart } from "./cart-context";
import { GarmentIllustration, ProductVisual } from "./product-visual";
import styles from "./catalogo.module.css";

export default function ProductDetails({ product, modal = false }: { product: CatalogProduct; modal?: boolean }) {
  const router = useRouter();
  const { addToCart, showToast } = useCart();
  const mediaItems = getProductMedia(product);
  const [activeMediaId, setActiveMediaId] = useState(mediaItems[0].id);
  const activeMedia = mediaItems.find((media) => media.id === activeMediaId) ?? mediaItems[0];

  useEffect(() => {
    if (!modal) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modal, router]);

  function changeMedia(direction: number) {
    if (mediaItems.length < 2) return;
    const currentIndex = mediaItems.findIndex((media) => media.id === activeMedia.id);
    const nextIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
    setActiveMediaId(mediaItems[nextIndex].id);
  }

  async function shareProduct() {
    const shareData = {
      title: product.name,
      text: `${product.name} (${product.sku}) — Bazar da Ana Rebeca`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Link da peça copiado");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showToast("Não foi possível compartilhar o link");
    }
  }

  function addProduct() {
    addToCart(product);
    if (modal) router.back();
  }

  const panel = (
    <section className={`${styles.productModal} ${!modal ? styles.productPageCard : ""}`} role={modal ? "dialog" : undefined} aria-modal={modal || undefined} aria-labelledby="product-title" onMouseDown={modal ? (event) => event.stopPropagation() : undefined}>
      {modal && <button className={styles.modalClose} type="button" onClick={() => router.back()} aria-label="Fechar detalhes"><X size={21} /></button>}
      <div className={styles.mediaGallery}>
        <div className={styles.mediaStage}>
          {activeMedia.type === "video" && !activeMedia.url ? <div className={styles.videoPlaceholder}><GarmentIllustration product={product} view={activeMedia.view} /><span className={styles.playButton}>▶</span><strong>Prévia do vídeo</strong><small>O vídeo enviado pela Viviane aparecerá aqui</small></div> : <ProductVisual product={product} media={activeMedia} />}
          {mediaItems.length > 1 && <><button className={`${styles.mediaArrow} ${styles.mediaArrowLeft}`} type="button" onClick={() => changeMedia(-1)} aria-label="Mídia anterior"><ArrowLeft size={18} /></button><button className={`${styles.mediaArrow} ${styles.mediaArrowRight}`} type="button" onClick={() => changeMedia(1)} aria-label="Próxima mídia"><ArrowRight size={18} /></button></>}
        </div>
        <div className={styles.mediaThumbs} aria-label="Fotos e vídeos da peça">{mediaItems.map((media) => <button key={media.id} type="button" className={media.id === activeMedia.id ? styles.activeMedia : ""} onClick={() => setActiveMediaId(media.id)}><span>{media.type === "video" ? "▶" : "◇"}</span>{media.label}</button>)}</div>
      </div>
      <div className={styles.modalContent}>
        <span className={styles.eyebrow}>{product.condition}</span>
        <h1 id="product-title">{product.name}</h1>
        <strong className={styles.modalPrice}>{currency.format(product.price)}</strong>
        <div className={styles.detailChips}><span>Código <b>{product.sku}</b></span><span>Categoria <b>{product.category}</b></span>{product.type && <span>Tipo <b>{product.type}</b></span>}<span>Tamanho <b>{product.size}</b></span><span>Disponível <b>{product.quantity}</b></span></div>
        <div className={styles.description}><h2>Sobre a peça</h2><p>{product.description}</p></div>
        <div className={styles.productActions}>
          <button className={styles.primaryButton} type="button" onClick={addProduct}><ShoppingBag size={18} /> Adicionar à sacola</button>
          <button className={styles.shareButton} type="button" onClick={shareProduct}><Share2 size={17} /> Compartilhar peça</button>
        </div>
      </div>
    </section>
  );

  if (modal) return <div className={`${styles.overlay} ${styles.catalogTheme}`} role="presentation" onMouseDown={() => router.back()}>{panel}</div>;

  return (
    <div className={`${styles.productPage} ${styles.catalogTheme}`}>
      <header className={styles.productPageHeader}>
        <Link className={styles.brand} href="/" aria-label="Bazar da Ana Rebeca — início"><span className={styles.brandMark}>AR</span><span><strong>Bazar</strong><small>da Ana Rebeca</small></span></Link>
        <Link className={styles.productBackLink} href="/"><ArrowLeft size={17} /> Voltar ao catálogo</Link>
      </header>
      <main className={styles.productPageMain}>{panel}</main>
    </div>
  );
}
