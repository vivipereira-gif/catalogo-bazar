export type ProductStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "reserved"
  | "sold"
  | "hidden";

export type Permissions = {
  can_create_products: boolean;
  can_edit_own_products: boolean;
  can_edit_all_products: boolean;
  can_upload_media: boolean;
  can_submit_review: boolean;
  can_review_products: boolean;
  can_publish_products: boolean;
  can_manage_users: boolean;
};

export type ProductMedia = {
  id: string;
  kind: "image" | "video";
  storage_path: string;
  label: string;
  sort_order: number;
  is_cover: boolean;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  public_url?: string;
};

export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  size: string;
  category: string;
  subtype: string | null;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  created_by: string;
  creator_name?: string;
  review_note: string | null;
  created_at: string;
  product_media: ProductMedia[];
};

export type TeamMember = {
  id: string;
  full_name: string;
  email: string;
  active: boolean;
  permissions: Permissions;
};

export const DEFAULT_HELPER_PERMISSIONS: Permissions = {
  can_create_products: true,
  can_edit_own_products: true,
  can_edit_all_products: false,
  can_upload_media: true,
  can_submit_review: true,
  can_review_products: false,
  can_publish_products: false,
  can_manage_users: false,
};

export const OWNER_PERMISSIONS: Permissions = {
  can_create_products: true,
  can_edit_own_products: true,
  can_edit_all_products: true,
  can_upload_media: true,
  can_submit_review: true,
  can_review_products: true,
  can_publish_products: true,
  can_manage_users: true,
};
