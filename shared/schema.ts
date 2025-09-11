import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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
  customMessage: text("custom_message"),
  originalImageUrl: text("original_image_url"),
  transformedImageUrl: text("transformed_image_url"),
  stats: jsonb("stats").$type<{ likes: number; shares: number; downloads: number }>().default(sql`'{"likes": 0, "shares": 0, "downloads": 0}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
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
