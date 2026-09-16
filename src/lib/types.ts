/** 后台 API 与页面共享的行类型（snake_case，与数据库列一致） */
import type { OrderStatus } from './constants';

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductRow {
  id: string;
  name: string;
  price: string;
  original_price: string | null;
  main_image: string | null;
  description: string | null;
  category_id: string;
  status: 'active' | 'inactive';
  stock: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends ProductRow {
  categories: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  image_url: string | null;
}

export interface BannerRow {
  id: string;
  title: string | null;
  image_key: string;
  link_target: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface CategorySectionRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_key: string;
  category_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  categories: Pick<CategoryRow, 'id' | 'name'> | null;
}

export interface HotRecommendationRow {
  id: string;
  product_id: string;
  title: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products: {
    id: string;
    name: string;
    price: string;
    main_image: string | null;
    status: string;
  } | null;
  image_url: string | null;
}

export interface CustomerRow {
  id: string;
  openid: string | null;
  nickname: string | null;
  name: string | null;
  phone: string;
  address: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

/** 客户管理列表项（含聚合统计） */
export interface CustomerWithStats extends CustomerRow {
  order_count: number;
  total_spent: string;
  latest_order_at: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  price: string;
  quantity: number;
  subtotal: string | null;
  main_image: string | null;
  image_url: string | null;
}

export interface OrderRow {
  id: string;
  order_no: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  address: string | null;
  remark: string | null;
  total_amount: string;
  delivery_fee: string;
  status: OrderStatus;
  paid_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 后台订单详情：关联客户对象与明细数组（snake_case 明细字段） */
export interface OrderWithItems extends OrderRow {
  customer: CustomerRow | null;
  items: OrderItemRow[];
}

/** 首页聚合数据 */
export interface HomepageData {
  brand: BrandSettings;
  banners: BannerRow[];
  sections: CategorySectionRow[];
  hot: HotRecommendationRow[];
}

/** 品牌文案（site_settings.brand） */
export interface BrandSettings {
  studio_name: string;
  slogan_primary: string;
  slogan_secondary: string;
}

/** 主题风格（site_settings.theme） */
export interface ThemeSettings {
  primary: string;
  background: string;
  text_primary: string;
  text_secondary: string;
  text_tertiary: string;
}

/** 仪表盘统计 */
export interface DashboardStats {
  todayRevenue: string;
  pendingRevenue: string;
  productTotal: number;
  activeProductTotal: number;
  customerTotal: number;
  bannerTotal: number;
  hotTotal: number;
  orderCounts: {
    pending_payment: number;
    paid: number;
    making: number;
    delivering: number;
    completed: number;
    cancelled: number;
  };
  recentOrders: Array<{
    id: string;
    order_no: string;
    status: OrderStatus;
    total_amount: string;
    created_at: string;
    customers: { name: string | null; phone: string | null } | null;
  }>;
}
