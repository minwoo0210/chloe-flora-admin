# 项目上下文

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

- 项目文件（如 app 目录、pages 目录、components 等）默认初始化到 `src/` 目录下。

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

### 编码规范

- 默认按 TypeScript `strict` 心智写代码；优先复用当前作用域已声明的变量、函数、类型和导入，禁止引用未声明标识符或拼错变量名。
- 禁止隐式 `any` 和 `as any`；函数参数、返回值、解构项、事件对象、`catch` 错误在使用前应有明确类型或先完成类型收窄，并清理未使用的变量和导入。

### next.config 配置规范

- 配置的路径不要写死绝对路径，必须使用 path.resolve(__dirname, ...)、import.meta.dirname 或 process.cwd() 动态拼接。

### Hydration 问题防范

1. 严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。**必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染**；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
2. **禁止使用 head 标签**，优先使用 metadata，详见文档：https://nextjs.org/docs/app/api-reference/functions/generate-metadata
   1. 三方 CSS、字体等资源可在 `globals.css` 中顶部通过 `@import` 引入或使用 next/font
   2. preload, preconnect, dns-prefetch 通过 ReactDOM 的 preload、preconnect、dns-prefetch 方法引入
   3. json-ld 可阅读 https://nextjs.org/docs/app/guides/json-ld

## UI 设计与组件规范 (UI & Styling Standards)

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

---

# Chloe Flora 花艺工作室 · Web 管理后台

供店主在浏览器中管理小程序前端全部内容（商品 / 首页 / 风格 / 订单 / 客户）。表结构与小程序端共享同一 Supabase 数据库。

## 业务模块与路由

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 登录 | `/login` | 邮箱+密码（Supabase Auth，邮箱自动确认） |
| 仪表盘 | `/dashboard` | 今日/待处理营收、订单数、客户数、最近订单 |
| 商品管理 | `/products` | 商品 CRUD、分类筛选/搜索、上下架、库存、主图；分类管理弹窗 |
| 首页内容 | `/homepage` | 品牌文案 Slogan、Banner、品类宣传区、热门推荐位（均支持排序/启用） |
| 风格配置 | `/theme` | 主题色/底色/三级文字色，色板+十六进制输入+手机实时预览 |
| 订单管理 | `/orders` | 订单列表/筛选/状态流转/详情（含客户、商品明细、配送费） |
| 客户管理 | `/customers` | 客户档案、下单数、累计消费、最近下单 |

受保护页面统一在 `src/app/(admin)/` 路由组，布局 `src/app/(admin)/layout.tsx` 做前端登录态守卫；所有 `/api/admin/*` 接口在服务端校验 `x-session`。

## 数据访问分层

- 表结构（唯一事实来源）：`src/storage/database/shared/schema.ts`（drizzle 定义）。改表后执行
  `COZE_API_TOKEN=$COZE_WORKLOAD_API_TOKEN npx coze-coding-ai db upgrade` 同步；新增列务必确认线上已生效（历史上出现过 upgrade 未补列的情况）。
- Drizzle 客户端：`src/storage/database/supabase-client.ts`，导出 `supabaseAdmin`（service role，绕过 RLS，仅服务端）与 `loadEnv()`（注入运行时环境变量）。
- 业务服务：`src/server/services/*.ts`（category / product / homepage / settings / order / stats），API Route 只做鉴权、参数校验、HTTP 响应，不直接拼 SQL。
- API 客户端：`src/lib/api-client.ts` 导出单例 `apiClient`（GET/POST/PUT/PATCH/DELETE，自动带 `x-session`、统一解包与 401 跳登录）。
- 共享类型：`src/lib/types.ts`；常量/状态机：`src/lib/constants.ts`；金额/日期：`src/lib/format.ts`。

## 鉴权约定

- 前端登录成功后把 supabase session 的 `access_token` 存 localStorage，请求统一放入 **`x-session`** header（不是 Authorization）。
- 服务端用 `src/lib/auth.ts` 的 `requireAdmin(request)` 校验并返回用户邮箱；`/api/supabase-config` 向前端下发 anonKey 与 URL（仅在有 session 时才缓存 token）。
- 当前为店主单角色（登录即全权）。新增管理员用 `pnpm tsx scripts/create-admin.ts <邮箱> <密码>`。

## 对象存储

- 图片使用 **Supabase Storage 的公开 bucket `media`**（`src/lib/storage.ts`）。原因：本项目沙箱未开通 coze S3 代理写权限（S3Storage 返回 AccessDenied），Supabase Storage 已验证可用。
- 数据库只持久化桶内相对 key（如 `products/xxx.jpg`）或历史外链（http(s) 原样返回）；列表经服务层转成公开 URL。
- 上传：`POST /api/admin/upload`（multipart，字段 `file` + `dir`）→ 返回 `{key,url}`；读取代理：`GET /api/media?key=`（302 到公开 URL）。
- 删除图片：`deleteMedia()`；删除商品/分类等默认不级联删图。

## 数据库 RLS 策略（与小程序端共享）

- `products / categories / banners / category_sections / hot_recommendations`：anon 只读「已上架/启用」行；管理后台全部经 service role 绕过 RLS。
- `site_settings`：anon 只读（风格配置需小程序实时同步）。
- `orders / order_items / customers`：anon 仅可 INSERT（小程序下单），不可读改；后台经 service role 全量管理。

## 种子数据

- 已内置 6 个分类、11 个商品、3 张 Banner、3 个品类宣传区、4 个热门位、品牌文案/主题、3 位客户与 5 笔订单。
- 订单种子：`pnpm tsx scripts/seed-orders.ts`（幂等，依赖商品与客户已存在）。
- 商品/首页种子目前通过 SQL 维护（见交付说明）。

## 关键业务规则

- 订单状态机 `pending_payment → paid → making → delivering → completed`，任一非取消状态可转 `cancelled`；逆向/跳跃流转返回 **409**。置为 completed 时写 `completed_at`。
- 商品金额、库存为 numeric/int；前端金额用 `formatCurrency`（服务端返回的 decimal 已 number 化）。
- 热门推荐位一个商品只能出现一次（部分唯一索引）；重复添加返回 409，删除为软删（`deleted_at`），重新添加会复活原记录。

## 验证命令

- 静态检查：`pnpm lint`、`pnpm ts-check`（交付前必须通过）。
- 接口冒烟：所有 `/api/admin/*` 需带有效 `x-session`；未登录应 401，资源不存在应 404，状态冲突应 409。
- 禁止手写测试文件；冒烟验证通过 `test_run` 的 curl 完成。
