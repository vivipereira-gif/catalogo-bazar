"use client";

/* eslint-disable @next/next/no-img-element -- URLs incluem prévias blob locais antes do upload. */

import {
  Archive,
  ArchiveRestore,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Send,
  Shirt,
  Sparkles,
  Trash2,
  UploadCloud,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatBytes, MEDIA_LIMITS } from "@/lib/media/constants";
import { processImage } from "@/lib/media/images";
import { processVideo } from "@/lib/media/video";
import {
  DEFAULT_HELPER_PERMISSIONS,
  type AdminProduct,
  type Permissions,
  type ProductMedia,
  type ProductStatus,
  type TeamMember,
} from "@/lib/admin/types";
import styles from "./admin.module.css";

type Section = "overview" | "products" | "new" | "edit" | "approvals" | "team";
type QueuedMedia = ProductMedia & { file: File; preview: string; originalBytes: number };
type ProductAction = "archive" | "delete" | "publish" | "reserve" | "sell";

async function requestProductAction(productId: string, action: ProductAction) {
  const response = await fetch("/api/admin/products/manage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, action }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível atualizar a peça.");
  return result as { deleted?: boolean; product?: { status: ProductStatus; featured: boolean; stock: number } };
}

const subtypes: Record<string, string[]> = {
  Feminino: ["Vestidos", "Blusas", "Calças", "Conjuntos", "Saias", "Calçados"],
  Infantil: ["Menino", "Menina", "Calçados"],
};
const categories = ["Feminino", "Masculino", "Infantil", "Acessórios", "Utilidades/Outros"];
const statusText: Record<ProductStatus, string> = {
  draft: "Rascunho",
  pending_review: "Aguardando aprovação",
  published: "Na vitrine",
  rejected: "Pediu ajustes",
  reserved: "Reservada",
  sold: "Vendida",
  hidden: "Arquivada",
};
const permissionLabels: Partial<Record<keyof Permissions, string>> = {
  can_create_products: "Cadastrar peças",
  can_upload_media: "Enviar fotos e vídeos",
  can_submit_review: "Enviar para aprovação",
  can_edit_all_products: "Editar peças de todos",
  can_review_products: "Aprovar e publicar ou devolver peças",
  can_publish_products: "Publicar, reservar, arquivar e marcar peças como vendidas",
  can_manage_users: "Gerenciar equipe e acessos",
};

const demoProducts: AdminProduct[] = [
  {
    id: "demo-1", sku: "AR-000001", name: "Vestido midi floral", description: "Viscose leve, cintura marcada.", price: 49,
    size: "M", category: "Feminino", subtype: "Vestidos", stock: 1, status: "pending_review",
    featured: false, created_by: "helper-demo", creator_name: "Marina", review_note: null,
    created_at: new Date().toISOString(), product_media: [],
  },
  {
    id: "demo-2", sku: "AR-000002", name: "Conjunto de linho", description: "Conjunto areia, ótimo estado.", price: 69,
    size: "G", category: "Feminino", subtype: "Conjuntos", stock: 1, status: "published",
    featured: true, created_by: "viviane-demo", creator_name: "Viviane", review_note: null,
    created_at: new Date(Date.now() - 86400000).toISOString(), product_media: [],
  },
  {
    id: "demo-3", sku: "AR-000003", name: "Bolsa caramelo", description: "Alça regulável e forro interno.", price: 35,
    size: "Único", category: "Acessórios", subtype: null, stock: 1, status: "draft",
    featured: false, created_by: "viviane-demo", creator_name: "Viviane", review_note: null,
    created_at: new Date(Date.now() - 172800000).toISOString(), product_media: [],
  },
];

const demoTeam: TeamMember[] = [
  { id: "viviane-demo", full_name: "Viviane", email: "viviane@bazar.com", active: true,
    permissions: Object.fromEntries(Object.keys(DEFAULT_HELPER_PERMISSIONS).map((key) => [key, true])) as unknown as Permissions },
  { id: "helper-demo", full_name: "Marina", email: "marina@bazar.com", active: true, permissions: DEFAULT_HELPER_PERMISSIONS },
];

export function AdminDashboard({
  demoMode = false,
  currentUser,
  permissions,
  initialProducts,
  initialTeam,
}: {
  demoMode?: boolean;
  currentUser: { id: string; name: string; email: string };
  permissions: Permissions;
  initialProducts: AdminProduct[];
  initialTeam: TeamMember[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [products, setProducts] = useState(demoMode && !initialProducts.length ? demoProducts : initialProducts);
  const [team, setTeam] = useState(demoMode && !initialTeam.length ? demoTeam : initialTeam);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => ({
    published: products.filter((p) => p.status === "published").length,
    pending: products.filter((p) => p.status === "pending_review").length,
    reserved: products.filter((p) => p.status === "reserved").length,
    sold: products.filter((p) => p.status === "sold").length,
    drafts: products.filter((p) => p.status === "draft" || p.status === "rejected").length,
  }), [products]);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4200);
  }

  async function signOut() {
    if (!demoMode) await createClient().auth.signOut();
    router.replace(demoMode ? "/" : "/admin/login");
    router.refresh();
  }

  async function updateProduct(id: string, patch: Partial<AdminProduct>) {
    const previous = products;
    setProducts((items) => items.map((p) => p.id === id ? { ...p, ...patch } : p));
    if (demoMode) return true;
    const { error } = await createClient().from("products").update(patch).eq("id", id);
    if (error) {
      setProducts(previous);
      announce(error.message);
      return false;
    }
    return true;
  }

  async function reviewProduct(product: AdminProduct, approve: boolean) {
    const note = approve ? null : window.prompt("O que precisa ser ajustado?", "Revise as informações da peça.");
    if (!approve && note === null) return;
    if (!demoMode) {
      const { error } = await createClient().rpc("review_product", {
        product_id: product.id, approve, note,
      });
      if (error) return announce(error.message);
    }
    setProducts((items) => items.map((item) => item.id === product.id ? {
      ...item, status: approve ? "published" : "rejected", review_note: note,
    } : item));
    announce(approve ? "Peça aprovada e publicada na vitrine." : "Peça devolvida para ajustes.");
  }

  async function manageProduct(product: AdminProduct, action: ProductAction) {
    try {
      if (!demoMode) await requestProductAction(product.id, action);
      if (action === "delete") {
        setProducts((items) => items.filter((item) => item.id !== product.id));
        announce("Peça e arquivos excluídos definitivamente.");
        return true;
      }
      const patch = action === "archive"
        ? { status: "hidden" as const, featured: false }
        : action === "reserve"
          ? { status: "reserved" as const }
          : action === "sell"
            ? { status: "sold" as const, stock: 0, featured: false }
            : { status: "published" as const, stock: product.status === "sold" ? 1 : product.stock };
      setProducts((items) => items.map((item) => item.id === product.id ? { ...item, ...patch } : item));
      const messages: Record<Exclude<ProductAction, "delete">, string> = {
        archive: "Peça arquivada e retirada da vitrine.",
        publish: product.status === "sold" ? "Peça devolvida à vitrine com uma unidade em estoque." : "Peça publicada na vitrine.",
        reserve: "Peça reservada e retirada temporariamente da vitrine.",
        sell: "Peça marcada como vendida e retirada da vitrine.",
      };
      announce(messages[action]);
      return true;
    } catch (cause) {
      announce(cause instanceof Error ? cause.message : "Não foi possível atualizar a peça.");
      return false;
    }
  }

  const nav = [
    { id: "overview" as const, label: "Visão geral", icon: LayoutDashboard },
    { id: "products" as const, label: "Peças", icon: Shirt },
    ...(permissions.can_create_products ? [{ id: "new" as const, label: "Nova peça", icon: Plus }] : []),
    ...(permissions.can_review_products ? [{ id: "approvals" as const, label: "Aprovações", icon: Clock3, badge: counts.pending }] : []),
    ...(permissions.can_manage_users ? [{ id: "team" as const, label: "Equipe e acessos", icon: Users }] : []),
  ];

  return (
    <main className={styles.admin}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span>AR</span><div>Bazar da<br /><strong>Ana Rebeca</strong></div></div>
        <nav>{nav.map((item) => <button key={item.id} className={section === item.id ? styles.activeNav : ""} onClick={() => setSection(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.badge ? <b>{item.badge}</b> : null}</button>)}</nav>
        <div className={styles.user}><div>{currentUser.name.slice(0, 1).toUpperCase()}</div><span><strong>{currentUser.name}</strong><small>{currentUser.email}</small></span><button title="Sair" onClick={signOut}><LogOut size={17} /></button></div>
      </aside>

      <section className={styles.workspace}>
        {demoMode && <div className={styles.demoBanner}><Eye size={16} /> Demonstração visual — conecte o Supabase para salvar dados reais.</div>}
        {notice && <div className={styles.toast}><Check size={17} />{notice}</div>}
        {section === "overview" && <Overview counts={counts} products={products} go={setSection} name={currentUser.name} canReview={permissions.can_review_products} />}
        {section === "products" && <Products products={products} currentUserId={currentUser.id} permissions={permissions} updateProduct={updateProduct} reviewProduct={reviewProduct} manageProduct={manageProduct} editProduct={(product) => { setEditingProduct(product); setSection("edit"); }} />}
        {section === "new" && <NewProduct currentUserId={currentUser.id} demoMode={demoMode} permissions={permissions} onCreated={(product) => { setProducts((items) => [product, ...items]); setSection("products"); announce(product.status === "published" ? `${product.sku} publicada diretamente na vitrine.` : product.status === "pending_review" ? `${product.sku} enviada para aprovação.` : `${product.sku} salva como rascunho.`); }} />}
        {section === "edit" && editingProduct && <EditProduct key={editingProduct.id} product={editingProduct} onCancel={() => { setEditingProduct(null); setSection("products"); }} onSave={async (patch) => { const saved = await updateProduct(editingProduct.id, patch); if (saved) { setEditingProduct(null); setSection("products"); announce("Alterações salvas com sucesso."); } return saved; }} />}
        {section === "approvals" && <Approvals products={products} reviewProduct={reviewProduct} />}
        {section === "team" && <Team demoMode={demoMode} members={team} setMembers={setTeam} currentUserId={currentUser.id} announce={announce} />}
      </section>
    </main>
  );
}

function PageTitle({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return <header className={styles.pageTitle}><div><p>{eyebrow}</p><h1>{title}</h1><span>{text}</span></div>{action}</header>;
}

function Overview({ counts, products, go, name, canReview }: { counts: Record<string, number>; products: AdminProduct[]; go: (s: Section) => void; name: string; canReview: boolean }) {
  const firstName = name.split(" ")[0];
  return <>
    <PageTitle eyebrow="Painel do bazar" title={`Olá, ${firstName}!`} text="Aqui está o que está acontecendo com a sua vitrine hoje." action={<button className={styles.primary} onClick={() => go("new")}><Plus size={17} /> Cadastrar peça</button>} />
    <div className={styles.stats}>
      <Stat icon={<Sparkles />} value={counts.published} label="na vitrine" tone="rose" />
      <Stat icon={<Clock3 />} value={counts.pending} label="para aprovar" tone="amber" />
      <Stat icon={<Clock3 />} value={counts.reserved} label="reservadas" tone="amber" />
      <Stat icon={<PackageCheck />} value={counts.sold} label="vendidas" tone="green" />
      <Stat icon={<Shirt />} value={counts.drafts} label="rascunhos e ajustes" tone="blue" />
    </div>
    <div className={styles.overviewGrid}>
      <section className={styles.panel}><div className={styles.panelHead}><div><h2>Movimentação recente</h2><p>Últimas peças cadastradas</p></div><button onClick={() => go("products")}>Ver todas <ChevronRight size={15} /></button></div><ProductRows products={products.slice(0, 4)} /></section>
      <aside className={styles.attention}><span><Clock3 size={22} /></span><p>Precisam da sua atenção</p><strong>{counts.pending} {counts.pending === 1 ? "peça aguarda" : "peças aguardam"} aprovação</strong><small>Confira fotos, preço e descrição antes de publicar.</small>{canReview && <button onClick={() => go("approvals")}>Revisar agora</button>}</aside>
    </div>
  </>;
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: string }) {
  return <div className={styles.stat}><span data-tone={tone}>{icon}</span><div><strong>{value}</strong><small>{label}</small></div></div>;
}

function ProductRows({ products }: { products: AdminProduct[] }) {
  if (!products.length) return <Empty text="Nenhuma peça por aqui ainda." />;
  return <div className={styles.productRows}>{products.map((product) => <div className={styles.productRow} key={product.id}><MediaThumb product={product} /><div><strong>{product.name}</strong><small><b>{product.sku}</b> · {product.category}{product.subtype ? ` · ${product.subtype}` : ""} · Tam. {product.size}</small></div><b>{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b><Status status={product.status} /></div>)}</div>;
}

function MediaThumb({ product }: { product: AdminProduct }) {
  const cover = product.product_media.find((m) => m.is_cover) ?? product.product_media[0];
  return cover?.public_url && cover.kind === "image" ? <img className={styles.thumb} src={cover.public_url} alt="" /> : <span className={styles.thumbPlaceholder}><Shirt size={20} /></span>;
}

function Status({ status }: { status: ProductStatus }) { return <span className={styles.status} data-status={status}>{statusText[status]}</span>; }

function Products({ products, currentUserId, permissions, updateProduct, reviewProduct, manageProduct, editProduct }: {
  products: AdminProduct[];
  currentUserId: string;
  permissions: Permissions;
  updateProduct: (id: string, patch: Partial<AdminProduct>) => Promise<boolean>;
  reviewProduct: (p: AdminProduct, approve: boolean) => void;
  manageProduct: (p: AdminProduct, action: ProductAction) => Promise<boolean>;
  editProduct: (p: AdminProduct) => void;
}) {
  const [filter, setFilter] = useState<ProductStatus | "all">("all");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const compactQuery = query.toLocaleUpperCase("pt-BR").replace(/[^A-Z0-9]/g, "");
  const visible = products.filter((product) => {
    const matchesStatus = filter === "all" || product.status === filter;
    const matchesQuery = !normalizedQuery ||
      product.name.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
      product.sku.replace(/[^A-Z0-9]/g, "").includes(compactQuery);
    return matchesStatus && matchesQuery;
  });

  async function confirmDelete(product: AdminProduct) {
    const mediaNotice = product.product_media.length
      ? ` e ${product.product_media.length} arquivo(s) do Storage`
      : "";
    if (!window.confirm(`Excluir “${product.name}”${mediaNotice} definitivamente? Esta ação não pode ser desfeita.`)) return;
    await manageProduct(product, "delete");
  }

  return <>
    <PageTitle eyebrow="Seu acervo" title="Todas as peças" text="Acompanhe o caminho de cada peça, do cadastro até a venda." />
    <div className={styles.productTools}>
      <label className={styles.productSearch}><Search size={17} /><span>Buscar peça</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código ou nome — ex.: AR-000042" /></label>
      <div className={styles.filters}>{(["all", "published", "reserved", "pending_review", "draft", "rejected", "sold", "hidden"] as const).map((item) => <button className={filter === item ? styles.selectedFilter : ""} key={item} onClick={() => setFilter(item)}>{item === "all" ? "Todas" : statusText[item]}</button>)}</div>
    </div>
    <section className={styles.panel}>{visible.length ? <div className={styles.cards}>{visible.map((product) => {
      const ownsEditableDraft = product.created_by === currentUserId && ["draft", "rejected"].includes(product.status) && permissions.can_edit_own_products;
      const managesCatalog = permissions.can_edit_all_products && permissions.can_publish_products;
      const canEdit = permissions.can_edit_all_products || ownsEditableDraft;
      const canDelete = managesCatalog || ownsEditableDraft;
      const canArchive = managesCatalog && !["draft", "rejected", "hidden"].includes(product.status);
      return <article className={styles.productCard} key={product.id}>
        <div className={styles.cardMedia}><MediaThumb product={product} />{product.featured && <span><Sparkles size={13} /> Destaque</span>}</div>
        <div className={styles.cardBody}>
          <header className={styles.cardLabels}><Status status={product.status} /><b>{product.sku}</b></header>
          <h3>{product.name}</h3>
          <p>{product.description || "Sem descrição"}</p>
          <div><strong>{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong><small>Estoque: {product.stock}</small></div>
          {product.review_note && <em>“{product.review_note}”</em>}
          <footer>
            {canEdit && <button onClick={() => editProduct(product)}><Pencil size={15} /> Editar</button>}
            {permissions.can_edit_all_products && product.status === "published" && <button onClick={() => updateProduct(product.id, { featured: !product.featured })}><Sparkles size={15} /> {product.featured ? "Tirar destaque" : "Destacar"}</button>}
            {managesCatalog && product.status === "published" && <button onClick={() => manageProduct(product, "reserve")}><Clock3 size={15} /> Reservar</button>}
            {managesCatalog && ["published", "reserved"].includes(product.status) && <button onClick={() => manageProduct(product, "sell")}><PackageCheck size={15} /> Marcar vendida</button>}
            {managesCatalog && ["reserved", "sold"].includes(product.status) && <button onClick={() => manageProduct(product, "publish")}><ArchiveRestore size={15} /> Voltar à vitrine</button>}
            {permissions.can_review_products && product.status === "pending_review" && <button onClick={() => reviewProduct(product, true)}><Check size={15} /> Aprovar</button>}
            {managesCatalog && ["draft", "rejected"].includes(product.status) && product.stock > 0 && <button onClick={() => manageProduct(product, "publish")}><Sparkles size={15} /> Publicar</button>}
            {canArchive && <button onClick={() => manageProduct(product, "archive")}><Archive size={15} /> Arquivar</button>}
            {managesCatalog && product.status === "hidden" && product.stock > 0 && <button onClick={() => manageProduct(product, "publish")}><ArchiveRestore size={15} /> Republicar</button>}
            {canDelete && <button className={styles.dangerAction} onClick={() => confirmDelete(product)}><Trash2 size={15} /> Excluir</button>}
          </footer>
        </div>
      </article>;
    })}</div> : <Empty text="Nenhuma peça neste filtro." />}</section>
  </>;
}

function Approvals({ products, reviewProduct }: { products: AdminProduct[]; reviewProduct: (p: AdminProduct, approve: boolean) => void }) {
  const pending = products.filter((p) => p.status === "pending_review");
  return <><PageTitle eyebrow="Curadoria" title="Aprovações" text="Só entra na vitrine o que você revisar e aprovar." />
    <section className={styles.panel}>{pending.length ? <div className={styles.approvalList}>{pending.map((product) => <article key={product.id}><MediaThumb product={product} /><div><Status status={product.status} /><h3>{product.name}</h3><p>{product.description}</p><small><b>{product.sku}</b> · Enviado por {product.creator_name || "membro da equipe"} · {product.category}{product.subtype ? ` / ${product.subtype}` : ""} · Tam. {product.size}</small><strong>{product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></div><footer><button className={styles.secondary} onClick={() => reviewProduct(product, false)}><X size={16} /> Pedir ajuste</button><button className={styles.primary} onClick={() => reviewProduct(product, true)}><Check size={16} /> Aprovar e publicar</button></footer></article>)}</div> : <Empty text="Tudo revisado! Não há peças aguardando aprovação." />}</section>
  </>;
}

function Empty({ text }: { text: string }) { return <div className={styles.empty}><Shirt size={28} /><p>{text}</p></div>; }

function EditProduct({ product, onCancel, onSave }: {
  product: AdminProduct;
  onCancel: () => void;
  onSave: (patch: Partial<AdminProduct>) => Promise<boolean>;
}) {
  const [category, setCategory] = useState(product.category);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const saved = await onSave({
      name: String(data.get("name")),
      description: String(data.get("description")),
      price: Number(data.get("price")),
      stock: Number(data.get("stock")),
      category,
      subtype: subtypes[category] ? String(data.get("subtype")) : null,
      size: String(data.get("size")),
    });
    if (!saved) setError("Não foi possível salvar as alterações. Revise os dados e tente novamente.");
    setBusy(false);
  }

  return <>
    <PageTitle
      eyebrow={`Editar anúncio · ${product.sku}`}
      title={product.name}
      text={product.status === "published" ? "As alterações salvas aparecem imediatamente na vitrine." : "Atualize as informações da peça."}
      action={<button className={styles.secondary} onClick={onCancel}>Cancelar edição</button>}
    />
    <form className={styles.productForm} onSubmit={save}>
      <section className={styles.formPanel}>
        <div className={styles.formHeading}><span>1</span><div><h2>Mídias atuais</h2><p>As fotos e o vídeo serão preservados nesta edição.</p></div></div>
        {product.product_media.length ? <div className={styles.mediaGrid}>{product.product_media.map((media) => (
          <div className={styles.mediaPreview} key={media.id}>
            {media.kind === "image" ? <img src={media.public_url || ""} alt={media.label || product.name} /> : <video src={media.public_url || ""} controls playsInline />}
            {media.is_cover && <b>Capa</b>}
            <small>{media.label || (media.kind === "image" ? "Foto" : "Vídeo")}</small>
          </div>
        ))}</div> : <Empty text="Esta peça ainda não possui mídia." />}
      </section>
      <section className={styles.formPanel}>
        <div className={styles.formHeading}><span>2</span><div><h2>Informações da peça</h2><p>Edite preço, estoque, categoria e descrição.</p></div></div>
        <div className={styles.fields}>
          <label className={styles.wide}>Nome da peça<input required minLength={2} maxLength={120} name="name" defaultValue={product.name} /></label>
          <label>Preço (R$)<input required min={0} step="0.01" name="price" type="number" defaultValue={product.price} /></label>
          <label>Quantidade disponível<input required min={0} max={999} name="stock" type="number" defaultValue={product.stock} /></label>
          <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
          {subtypes[category] && <label>Tipo<select key={category} name="subtype" defaultValue={category === product.category ? product.subtype ?? subtypes[category][0] : subtypes[category][0]}>{subtypes[category].map((item) => <option key={item}>{item}</option>)}</select></label>}
          <label>Tamanho<input required maxLength={40} name="size" defaultValue={product.size} /></label>
          <label className={styles.wide}>Descrição<textarea required maxLength={3000} name="description" rows={5} defaultValue={product.description} /></label>
        </div>
      </section>
      {error && <div className={styles.formError}>{error}</div>}
      <footer className={styles.formActions}>
        <span>O status e as mídias atuais serão mantidos.</span>
        <button type="button" className={styles.secondary} onClick={onCancel}>Cancelar</button>
        <button className={styles.primary} disabled={busy}><Pencil size={16} /> {busy ? "Salvando…" : "Salvar alterações"}</button>
      </footer>
    </form>
  </>;
}

function NewProduct({ currentUserId, demoMode, permissions, onCreated }: { currentUserId: string; demoMode: boolean; permissions: Permissions; onCreated: (p: AdminProduct) => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState("Feminino");
  const [media, setMedia] = useState<QueuedMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState("");

  async function addImages(files: FileList | null) {
    if (!files) return;
    const imageCount = media.filter((m) => m.kind === "image").length;
    const selected = Array.from(files).slice(0, MEDIA_LIMITS.maxImages - imageCount);
    setProcessing("Otimizando fotos…"); setError("");
    try {
      const results = await Promise.all(selected.map(processImage));
      setMedia((items) => [...items, ...results.map((result, index) => ({
        id: crypto.randomUUID(), kind: "image" as const, file: result.file,
        storage_path: "", label: index === 0 && imageCount === 0 ? "Frente" : "Detalhe",
        sort_order: imageCount + index, is_cover: imageCount === 0 && index === 0,
        mime_type: result.file.type, size_bytes: result.processedBytes, duration_seconds: null,
        width: result.width, height: result.height, preview: URL.createObjectURL(result.file),
        public_url: URL.createObjectURL(result.file), originalBytes: result.originalBytes,
      }))]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível processar as fotos."); }
    finally { setProcessing(""); }
  }

  async function addVideo(file: File | undefined) {
    if (!file || media.some((m) => m.kind === "video")) return;
    setError(""); setProcessing("Preparando vídeo… 0%");
    try {
      const result = await processVideo(file, (value) => setProcessing(`Comprimindo vídeo… ${Math.round(value * 100)}%`));
      const preview = URL.createObjectURL(result.file);
      setMedia((items) => [...items, { id: crypto.randomUUID(), kind: "video", file: result.file,
        storage_path: "", label: "Vídeo", sort_order: items.length, is_cover: false,
        mime_type: result.file.type, size_bytes: result.processedBytes, duration_seconds: result.duration,
        width: result.width, height: result.height, preview, public_url: preview, originalBytes: result.originalBytes }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível processar o vídeo."); }
    finally { setProcessing(""); }
  }

  function removeMedia(id: string) {
    setMedia((items) => {
      const removed = items.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      const next = items.filter((item) => item.id !== id);
      if (removed?.is_cover && next[0]) next[0] = { ...next[0], is_cover: true };
      return next;
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedAction = submitter?.value;
    const targetStatus: ProductStatus = requestedAction === "publish" && permissions.can_publish_products
      ? "published"
      : requestedAction === "review" && permissions.can_submit_review
        ? "pending_review"
        : "draft";
    const data = new FormData(event.currentTarget);
    if (!media.some((item) => item.kind === "image")) return setError("Adicione ao menos uma foto da peça.");
    setBusy(true);
    const base = {
      name: String(data.get("name")), description: String(data.get("description")),
      price: Number(data.get("price")), size: String(data.get("size")), category,
      subtype: subtypes[category] ? String(data.get("subtype")) : null,
      stock: Number(data.get("stock")), featured: false, created_by: currentUserId,
    };
    try {
      if (demoMode) {
        onCreated({ ...base, id: crypto.randomUUID(), sku: `AR-${String(Date.now()).slice(-6)}`, status: targetStatus,
          creator_name: "Você", review_note: null, created_at: new Date().toISOString(),
          product_media: media.map((item) => ({
            id: item.id, kind: item.kind, storage_path: item.storage_path, label: item.label,
            sort_order: item.sort_order, is_cover: item.is_cover, mime_type: item.mime_type,
            size_bytes: item.size_bytes, duration_seconds: item.duration_seconds,
            width: item.width, height: item.height, public_url: item.public_url,
          })) });
        return;
      }
      const supabase = createClient();
      const { data: product, error: productError } = await supabase.from("products").insert({ ...base, status: "draft" }).select().single();
      if (productError) throw productError;
      const uploaded: ProductMedia[] = [];
      for (const [index, item] of media.entries()) {
        setProcessing(`Enviando arquivo ${index + 1} de ${media.length}…`);
        const authorizationResponse = await fetch("/api/admin/storage/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, kind: item.kind }),
        });
        const authorization = await authorizationResponse.json();
        if (!authorizationResponse.ok) {
          throw new Error(authorization.error || "Não foi possível autorizar o envio do arquivo.");
        }
        const path = String(authorization.path);
        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .uploadToSignedUrl(path, String(authorization.token), item.file, { contentType: item.mime_type });
        if (uploadError) throw uploadError;
        const metadata = { product_id: product.id, kind: item.kind, storage_path: path, label: item.label,
          sort_order: index, is_cover: item.is_cover, mime_type: item.mime_type, size_bytes: item.size_bytes,
          duration_seconds: item.duration_seconds, width: item.width, height: item.height, created_by: currentUserId };
        const { data: savedMedia, error: mediaError } = await supabase.from("product_media").insert(metadata).select().single();
        if (mediaError) throw mediaError;
        uploaded.push({ ...savedMedia, public_url: supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl });
      }
      if (targetStatus === "published") {
        await requestProductAction(product.id, "publish");
      } else if (targetStatus === "pending_review") {
        const { error: reviewError } = await supabase.rpc("submit_product_for_review", { product_id: product.id });
        if (reviewError) throw reviewError;
      }
      onCreated({ ...product, price: Number(product.price), status: targetStatus, product_media: uploaded });
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : "Não foi possível salvar."} O rascunho e os arquivos já enviados foram preservados.`);
    } finally { setBusy(false); setProcessing(""); }
  }

  return <>
    <PageTitle eyebrow="Novo anúncio" title="Cadastrar uma peça" text="Capriche nas fotos e nas informações. Você pode salvar e terminar depois." />
    <form className={styles.productForm} onSubmit={save} ref={formRef}>
      <section className={styles.formPanel}><div className={styles.formHeading}><span>1</span><div><h2>Fotos e vídeo</h2><p>As fotos são convertidas para WebP antes do envio.</p></div></div>
        <div className={styles.mediaGrid}>{media.map((item) => <div className={styles.mediaPreview} key={item.id}>{item.kind === "image" ? <img src={item.preview} alt="Prévia" /> : <video src={item.preview} muted playsInline />}<button type="button" onClick={() => removeMedia(item.id)}><X size={15} /></button>{item.is_cover && <b>Capa</b>}<small>{formatBytes(item.originalBytes)} → {formatBytes(item.size_bytes)}</small></div>)}
          {media.filter((m) => m.kind === "image").length < MEDIA_LIMITS.maxImages && <label className={styles.uploader}><ImagePlus size={25} /><strong>Adicionar fotos</strong><span>JPG, PNG ou WebP</span><input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addImages(e.target.files)} /></label>}
          {!media.some((m) => m.kind === "video") && <label className={styles.uploader}><Video size={25} /><strong>Adicionar vídeo</strong><span>Até 15s · saída máx. 6 MB</span><input hidden type="file" accept="video/*" onChange={(e) => addVideo(e.target.files?.[0])} /></label>}
        </div>{processing && <p className={styles.processing}><UploadCloud size={16} /> {processing}</p>}
      </section>
      <section className={styles.formPanel}><div className={styles.formHeading}><span>2</span><div><h2>Informações da peça</h2><p>Inclua medidas, cor, tecido e qualquer detalhe importante.</p></div></div>
        <div className={styles.fields}><label className={styles.wide}>Nome da peça<input required minLength={2} maxLength={120} name="name" placeholder="Ex.: Vestido midi floral" /></label><label>Preço (R$)<input required min={0} step="0.01" name="price" type="number" placeholder="49,00" /></label><label>Quantidade disponível<input required min={1} max={999} defaultValue={1} name="stock" type="number" /></label><label>Categoria<select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>{subtypes[category] && <label>Tipo<select name="subtype">{subtypes[category].map((item) => <option key={item}>{item}</option>)}</select></label>}<label>Tamanho<input required maxLength={40} name="size" placeholder="P, M, 38 ou Único" /></label><label className={styles.wide}>Descrição<textarea required maxLength={3000} name="description" rows={5} placeholder="Medidas, cor, tecido, estado de conservação…" /></label></div>
      </section>
      {error && <div className={styles.formError}>{error}</div>}
      <footer className={styles.formActions}>
        <span>{permissions.can_publish_products ? "Você pode salvar como rascunho ou publicar direto na vitrine." : "Você poderá editar enquanto estiver em rascunho."}</span>
        <button type="submit" value="draft" className={styles.secondary} disabled={busy}>Salvar rascunho</button>
        {permissions.can_publish_products
          ? <button type="submit" value="publish" className={styles.primary} disabled={busy}><Sparkles size={16} /> {busy ? "Publicando…" : "Publicar na vitrine"}</button>
          : permissions.can_submit_review && <button type="submit" value="review" className={styles.primary} disabled={busy}><Send size={16} /> {busy ? "Salvando…" : "Enviar para aprovação"}</button>}
      </footer>
    </form>
  </>;
}

function Team({ demoMode, members, setMembers, currentUserId, announce }: { demoMode: boolean; members: TeamMember[]; setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>; currentUserId: string; announce: (s: string) => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const [busy, setBusy] = useState(false);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget);
    const member: TeamMember = { id: crypto.randomUUID(), full_name: String(data.get("fullName")), email: String(data.get("email")), active: true, permissions: { ...DEFAULT_HELPER_PERMISSIONS } };
    if (!demoMode) {
      const response = await fetch("/api/admin/users/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: member.full_name, email: member.email, permissions: member.permissions }) });
      const result = await response.json();
      if (!response.ok) { announce(result.error || "Não foi possível enviar o convite."); setBusy(false); return; }
      Object.assign(member, result.member);
    }
    setMembers((items) => [...items, member]); setShowInvite(false); setBusy(false); announce(`Convite enviado para ${member.email}.`);
  }
  async function togglePermission(member: TeamMember, key: keyof Permissions) {
    const next = { ...member.permissions, [key]: !member.permissions[key] };
    setMembers((items) => items.map((item) => item.id === member.id ? { ...item, permissions: next } : item));
    if (!demoMode) {
      const { error } = await createClient().from("user_permissions").update({ [key]: next[key] }).eq("user_id", member.id);
      if (error) announce(error.message); else announce("Acessos atualizados.");
    }
  }
  return <><PageTitle eyebrow="Colaboração segura" title="Equipe e acessos" text="Convide quem ajuda no bazar e escolha exatamente o que cada pessoa pode fazer." action={<button className={styles.primary} onClick={() => setShowInvite(true)}><UserPlus size={17} /> Convidar pessoa</button>} />
    {showInvite && <form className={styles.invite} onSubmit={invite}><div><h2>Novo convite</h2><button type="button" onClick={() => setShowInvite(false)}><X /></button></div><p>A pessoa receberá um e-mail para criar a senha. Começará com o perfil “Assistente de cadastro”.</p><label>Nome completo<input required name="fullName" minLength={2} /></label><label>E-mail<input required name="email" type="email" /></label><footer><button className={styles.secondary} type="button" onClick={() => setShowInvite(false)}>Cancelar</button><button className={styles.primary} disabled={busy}>{busy ? "Enviando…" : "Enviar convite"}</button></footer></form>}
    <div className={styles.teamList}>{members.map((member) => <article key={member.id}><header><span>{member.full_name.slice(0, 1).toUpperCase()}</span><div><h3>{member.full_name}{member.id === currentUserId && <small>Você</small>}</h3><p>{member.email}</p></div><b>{member.active ? "Ativo" : "Pausado"}</b></header><div className={styles.permissions}><p>Acessos permitidos</p>{Object.entries(permissionLabels).map(([key, label]) => <label key={key}><span><strong>{label}</strong>{key === "can_submit_review" && <small>As peças ficam pendentes até sua aprovação</small>}</span><input type="checkbox" disabled={member.id === currentUserId} checked={member.permissions[key as keyof Permissions]} onChange={() => togglePermission(member, key as keyof Permissions)} /></label>)}</div></article>)}</div>
    <aside className={styles.safety}><Check size={18} /><div><strong>Aprovação protegida</strong><p>Assistentes podem fotografar, cadastrar e enviar. A peça só aparece para clientes depois da aprovação de quem tiver o acesso “Aprovar ou devolver peças”.</p></div></aside>
  </>;
}
