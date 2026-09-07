/* eslint-disable @next/next/no-img-element -- as imagens públicas vêm do storage do catálogo. */

import type { CatalogProduct, ProductMedia } from "@/lib/catalog/types";
import styles from "./catalogo.module.css";

export function GarmentIllustration({ product, view = "front" }: { product: CatalogProduct; view?: ProductMedia["view"] }) {
  const common = {
    fill: "currentColor",
    stroke: "rgba(92, 67, 72, .18)",
    strokeWidth: 1.5,
  };
  const viewClass = view === "back" ? styles.backView : view === "detail" ? styles.detailView : "";

  return (
    <div className={`${styles.productVisual} ${styles[product.tone]} ${viewClass}`}>
      <span className={styles.imageLabel}>Foto demonstrativa</span>
      <svg viewBox="0 0 220 260" role="img" aria-label={`Ilustração de ${product.name}`}>
        {product.garment === "dress" && (
          <>
            <path {...common} d="M83 36c8 9 46 9 54 0l15 25-20 13 31 136c-34 18-72 18-106 0L88 74 68 61z" />
            <path d="M92 40c2 18 34 18 36 0" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="3" />
            <g fill="rgba(255,255,255,.63)"><circle cx="86" cy="114" r="4"/><circle cx="128" cy="98" r="5"/><circle cx="111" cy="152" r="4"/><circle cx="77" cy="178" r="5"/><circle cx="139" cy="187" r="4"/></g>
          </>
        )}
        {product.garment === "shirt" && <path {...common} d="M78 44 94 34c7 11 25 11 32 0l16 10 40 42-25 22-19-20v130H82V88l-19 20-25-22z" />}
        {product.garment === "pants" && <path {...common} d="M73 38h74l9 176-37 4-9-112-9 112-37-4z" />}
        {product.garment === "set" && <><path {...common} d="M79 43 94 34c7 11 25 11 32 0l15 9 25 42-23 14-12-19v58H89V80L77 99 54 85z" /><path {...common} d="M87 146h46l22 72H65z" /></>}
        {product.garment === "cardigan" && <><path {...common} d="M78 44 95 34c6 10 24 10 30 0l17 10 37 48-24 19-18-25v132H83V86l-18 25-24-19z" /><path d="M110 45v171" stroke="rgba(255,255,255,.7)" strokeWidth="3" /><g fill="rgba(255,255,255,.8)"><circle cx="116" cy="85" r="3"/><circle cx="116" cy="111" r="3"/><circle cx="116" cy="137" r="3"/><circle cx="116" cy="163" r="3"/></g></>}
        {product.garment === "skirt" && <><path {...common} d="M82 49h56l27 169H55z" /><path d="M96 59 82 211M110 59v152M124 59l14 152" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" /></>}
        {product.garment === "shoes" && <><path {...common} d="M45 157c34 1 50-30 60-69l29 10c-5 42 7 57 42 68 15 5 17 30-6 36H67c-31-1-43-17-22-45Z"/><path d="M66 165c36 6 61-15 66-55M45 187h137" fill="none" stroke="rgba(255,255,255,.58)" strokeWidth="4"/></>}
        {product.garment === "bag" && <><path {...common} d="M50 94h120l13 119H37z"/><path d="M78 105V78c0-39 64-39 64 0v27" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round"/></>}
        {product.garment === "home" && <><path {...common} d="M49 104h122l-13 111H62z"/><path d="M45 90h130v27H45z" fill="currentColor"/><path d="M79 91c4-48 58-48 62 0" fill="none" stroke="currentColor" strokeWidth="10"/></>}
        {view === "back" && <path d="M110 52v154" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeDasharray="5 5" />}
      </svg>
    </div>
  );
}

export function ProductVisual({ product, media }: { product: CatalogProduct; media?: ProductMedia }) {
  if (media?.url && media.type === "video") {
    return <video className={styles.realProductImage} controls playsInline src={media.url}>Seu navegador não suporta vídeo.</video>;
  }
  if (media?.url) return <img className={styles.realProductImage} src={media.url} alt={`${product.name} — ${media.label}`} />;
  return <GarmentIllustration product={product} view={media?.view} />;
}
