import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const petTransformations = pgTable("pet_transformations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  petName: text("pet_name").notNull(),
  petBreed: text("pet_breed"),
  theme: text("theme").notNull(), // 'baseball' | 'superhero'
  traits: jsonb("traits").$type<string[]>().default(sql`'[]'::jsonb`),
  gender: text("gender"),
  originalImageUrl: text("original_image_url"),
  transformedImageUrl: text("transformed_image_url"),
  stats: jsonb("stats").$type<{ likes: number; shares: number; downloads: number }>().default(sql`'{"likes": 0, "shares": 0, "downloads": 0}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteMetrics = pgTable("site_metrics", {
  id: text("id").primaryKey().default("global"),
  transforms: integer("transforms").notNull().default(128),
  shares: integer("shares").notNull().default(340),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPetTransformationSchema = createInsertSchema(petTransformations, {
  traits: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdAt: true,
  stats: true,
  transformedImageUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPetTransformation = z.infer<typeof insertPetTransformationSchema>;
export type PetTransformation = typeof petTransformations.$inferSelect;
export type SiteMetrics = typeof siteMetrics.$inferSelect;

// Backend prompt optimization system
export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'superhero' or 'baseball'
  basePrompt: text("base_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const promptVariants = pgTable("prompt_variants", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => promptTemplates.id).notNull(),
  prompt: text("prompt").notNull(),
  successRate: real("success_rate").default(0), // Track performance
  timesUsed: integer("times_used").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const promptVariantSchema = createInsertSchema(promptVariants).omit({
  id: true,
  createdAt: true,
});

export type PromptTemplateInsert = z.infer<typeof promptTemplateSchema>;
export type PromptTemplateSelect = typeof promptTemplates.$inferSelect;
export type PromptVariantInsert = z.infer<typeof promptVariantSchema>;
export type PromptVariantSelect = typeof promptVariants.$inferSelect;
