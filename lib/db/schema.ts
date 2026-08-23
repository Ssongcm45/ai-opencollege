import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const adminConfig = pgTable("admin_config", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  sessionVersion: integer("session_version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: varchar("action", { length: 60 }).notNull(),
  detail: varchar("detail", { length: 300 }),
  ip: varchar("ip", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  published: boolean("published").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const fieldCases = pgTable("field_cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  clientType: varchar("client_type", { length: 80 }).notNull(),
  hours: varchar("hours", { length: 40 }).notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  videoUrl: varchar("video_url", { length: 500 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const portfolioItems = pgTable("portfolio_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 40 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 80 }).notNull(),
  organization: varchar("organization", { length: 140 }),
  email: varchar("email", { length: 160 }),
  phone: varchar("phone", { length: 60 }),
  audience: varchar("audience", { length: 120 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 40 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const inquiryNotes = pgTable("inquiry_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  inquiryId: uuid("inquiry_id").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  scope: varchar("scope", { length: 20 }).notNull(),
  name: varchar("name", { length: 60 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("categories_scope_name_unique").on(table.scope, table.name)
]);

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  siteTitle: varchar("site_title", { length: 120 }),
  siteDescription: text("site_description"),
  ogImageUrl: varchar("og_image_url", { length: 500 }),
  faviconUrl: varchar("favicon_url", { length: 500 }),
  naverVerification: varchar("naver_verification", { length: 300 }),
  googleVerification: varchar("google_verification", { length: 300 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const checkGroups = pgTable("check_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  aiSummary: text("ai_summary"),
  aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const checkResponses = pgTable("check_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull(),
  name: varchar("name", { length: 80 }),
  department: varchar("department", { length: 80 }),
  position: varchar("position", { length: 60 }),
  phone: varchar("phone", { length: 60 }),
  email: varchar("email", { length: 160 }),
  note: text("note"),
  role: varchar("role", { length: 60 }),
  frequency: varchar("frequency", { length: 60 }),
  environment: varchar("environment", { length: 120 }),
  purpose: varchar("purpose", { length: 60 }),
  answers: jsonb("answers").notNull(),
  scoreA: integer("score_a").notNull(),
  scoreB: integer("score_b").notNull(),
  scoreC: integer("score_c").notNull(),
  scoreD: integer("score_d"),
  scoreE: integer("score_e").notNull(),
  validAverage: real("valid_average").notNull(),
  baseLevel: integer("base_level").notNull(),
  finalLevel: integer("final_level").notNull(),
  dApplicable: boolean("d_applicable").notNull(),
  gateCount: integer("gate_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const checkCompletions = pgTable("check_completions", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: varchar("source", { length: 40 }).notNull().default("individual"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export type CheckGroup = typeof checkGroups.$inferSelect;
export type CheckResponse = typeof checkResponses.$inferSelect;

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type FieldCase = typeof fieldCases.$inferSelect;
export type NewFieldCase = typeof fieldCases.$inferInsert;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
