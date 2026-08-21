import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const adminConfig = pgTable("admin_config", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash"),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 180 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  category: varchar("category", { length: 60 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
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

export const blogCategories = pgTable("blog_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

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

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type FieldCase = typeof fieldCases.$inferSelect;
export type NewFieldCase = typeof fieldCases.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
