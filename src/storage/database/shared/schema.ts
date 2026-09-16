import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Chloe Flora 共享数据契约（管理后台 Web 端 + 小程序端读写同一套表）
 *
 * 约定：
 * - 主键统一 varchar(36) UUID，金额 numeric(10,2)，时间均带时区
 * - 所有字段 snake_case
 * - 图片字段统一存对象存储 key（如 "products/xxx.jpg"），
 *   访问时由后端 /api/media?key=xxx 302 到签名 URL，禁止持久化签名链接
 */

// 系统表，禁止删除（迁移工具依赖）
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ───────────────────────── 商品与分类 ─────────────────────────

/** 商品分类：鲜花束 / 永生花 / 花篮 / 绿植盆栽 / 婚礼布置 / 商业布置 */
export const categories = pgTable(
  "categories",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 64 }).notNull(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    description: varchar("description", { length: 255 }),
    sort_order: integer("sort_order").default(0).notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("categories_sort_order_idx").on(table.sort_order)]
);

export type ProductStatus = "active" | "inactive";

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
    original_price: numeric("original_price", { precision: 10, scale: 2 }),
    /** 主图：对象存储 key */
    main_image: text("main_image"),
    description: text("description"),
    category_id: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => categories.id),
    /** active=上架 inactive=下架 */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    stock: integer("stock").notNull().default(0),
    /** 小程序端排序，越小越靠前 */
    sort_order: integer("sort_order").default(0).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_category_id_idx").on(table.category_id),
    index("products_status_idx").on(table.status),
    index("products_sort_order_idx").on(table.sort_order),
  ]
);

// ───────────────────────── 小程序首页内容 ─────────────────────────

/** 首页 Banner 轮播图 */
export const banners = pgTable(
  "banners",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 128 }),
    image_key: text("image_key").notNull(),
    /** 跳转目标：商品 id / 分类 slug / 外部链接，由小程序端解释 */
    link_target: varchar("link_target", { length: 255 }),
    sort_order: integer("sort_order").default(0).notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("banners_active_sort_idx").on(table.is_active, table.sort_order),
  ]
);

/** 首页品类主题宣传区：标题 + 宣传图 + 关联分类 + 排序 */
export const category_sections = pgTable(
  "category_sections",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 128 }).notNull(),
    subtitle: varchar("subtitle", { length: 255 }),
    image_key: text("image_key").notNull(),
    category_id: varchar("category_id", { length: 36 }).references(() => categories.id),
    sort_order: integer("sort_order").default(0).notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("category_sections_sort_idx").on(table.sort_order)]
);

/** 首页热门花礼推荐位：同一商品只能占一个推荐位 */
export const hot_recommendations = pgTable(
  "hot_recommendations",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    product_id: varchar("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** 推荐位标题，可空（空则小程序用商品名） */
    title: varchar("title", { length: 128 }),
    sort_order: integer("sort_order").default(0).notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("hot_recommendations_product_idx").on(table.product_id),
    index("hot_recommendations_active_sort_idx").on(table.is_active, table.sort_order),
  ]
);

/**
 * 站点级键值配置（单行 JSONB 按 key 组织）
 * - key='brand'  品牌文案：{ slogan, sub_slogan }
 * - key='theme'  小程序视觉参数：{ theme_color, bg_color, text_primary, text_secondary, text_tertiary }
 */
export const site_settings = pgTable("site_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ───────────────────────── 客户与订单 ─────────────────────────

/** 小程序客户（以微信 openid 去重；客户也可来自手动录入订单） */
export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    openid: varchar("openid", { length: 128 }),
    nickname: varchar("nickname", { length: 128 }),
    name: varchar("name", { length: 64 }),
    phone: varchar("phone", { length: 32 }).notNull(),
    address: varchar("address", { length: 255 }),
    remark: varchar("remark", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customers_openid_idx").on(table.openid),
    index("customers_phone_idx").on(table.phone),
  ]
);

export type OrderStatus =
  | "pending_payment" // 待付款
  | "paid" // 已付款
  | "making" // 制作中
  | "delivering" // 配送中
  | "completed" // 已完成
  | "cancelled"; // 已取消

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_no: varchar("order_no", { length: 32 }).notNull().unique(),
    customer_id: varchar("customer_id", { length: 36 }).references(() => customers.id, {
      onDelete: "set null",
    }),
    // 冗余联系人信息，保证客户资料变更不影响历史订单
    customer_name: varchar("customer_name", { length: 64 }).notNull(),
    customer_phone: varchar("customer_phone", { length: 32 }).notNull(),
    address: varchar("address", { length: 255 }),
    remark: varchar("remark", { length: 255 }),
    total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    delivery_fee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
    status: varchar("status", { length: 24 }).notNull().default("pending_payment"),
    paid_at: timestamp("paid_at", { withTimezone: true }),
    delivered_at: timestamp("delivered_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_customer_id_idx").on(table.customer_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
    index("orders_status_created_idx").on(table.status, table.created_at),
  ]
);

/** 订单明细：下单时的商品快照（名称/单价/图片），商品被删仍可查 */
export const orderItems = pgTable(
  "order_items",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    order_id: varchar("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    product_id: varchar("product_id", { length: 36 }).references(() => products.id, {
      onDelete: "set null",
    }),
    product_name: varchar("product_name", { length: 128 }).notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }),
    main_image: varchar("main_image", { length: 512 }),
    image_key: text("image_key"),
  },
  (table) => [index("order_items_order_id_idx").on(table.order_id)]
);
