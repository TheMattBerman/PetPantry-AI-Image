import { type User, type InsertUser, type PetTransformation, type InsertPetTransformation, type PromptTemplateInsert, type PromptTemplateSelect, type PromptVariantInsert, type PromptVariantSelect, users, petTransformations, promptTemplates, promptVariants } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pet transformation methods
  getPetTransformation(id: string): Promise<PetTransformation | undefined>;
  createPetTransformation(transformation: InsertPetTransformation): Promise<PetTransformation>;
  updatePetTransformation(id: string, updates: Partial<PetTransformation>): Promise<PetTransformation | undefined>;
  updatePetTransformationStats(id: string, stats: { likes: number; shares: number; downloads: number }): Promise<void>;
  getUserTransformations(userId: string): Promise<PetTransformation[]>;

  // Backend prompt optimization methods
  getActivePromptTemplate(category: string): Promise<PromptTemplateSelect | undefined>;
  getAllPromptTemplates(): Promise<PromptTemplateSelect[]>;
  createPromptTemplate(template: PromptTemplateInsert): Promise<PromptTemplateSelect>;
  updatePromptTemplate(id: number, updates: Partial<PromptTemplateSelect>): Promise<PromptTemplateSelect | undefined>;
  getPromptVariants(templateId: number): Promise<PromptVariantSelect[]>;
  getBestPromptVariant(templateId: number): Promise<PromptVariantSelect | undefined>;
  createPromptVariant(variant: PromptVariantInsert): Promise<PromptVariantSelect>;
  updatePromptVariantStats(id: number, successRate: number): Promise<void>;
}

// Referenced from javascript_database integration - using DatabaseStorage instead of MemStorage
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([insertUser])
      .returning();
    return user;
  }

  async getPetTransformation(id: string): Promise<PetTransformation | undefined> {
    const [transformation] = await db.select().from(petTransformations).where(eq(petTransformations.id, id));
    return transformation || undefined;
  }

  async createPetTransformation(insertTransformation: InsertPetTransformation): Promise<PetTransformation> {
    const [transformation] = await db
      .insert(petTransformations)
      .values(insertTransformation)
      .returning();
    return transformation;
  }

  async updatePetTransformation(id: string, updates: Partial<PetTransformation>): Promise<PetTransformation | undefined> {
    const [transformation] = await db
      .update(petTransformations)
      .set(updates)
      .where(eq(petTransformations.id, id))
      .returning();
    return transformation || undefined;
  }

  async updatePetTransformationStats(id: string, stats: { likes: number; shares: number; downloads: number }): Promise<void> {
    await db
      .update(petTransformations)
      .set({ stats })
      .where(eq(petTransformations.id, id));
  }

  async getUserTransformations(userId: string): Promise<PetTransformation[]> {
    return await db.select().from(petTransformations).where(eq(petTransformations.userId, userId));
  }

  // Backend prompt optimization methods
  async getActivePromptTemplate(category: string): Promise<PromptTemplateSelect | undefined> {
    // Get all active templates for the category
    const templates = await db.select().from(promptTemplates)
      .where(and(eq(promptTemplates.category, category), eq(promptTemplates.isActive, true)));
    
    if (templates.length === 0) {
      return undefined;
    }
    
    // Randomly select one template to provide variety
    const randomIndex = Math.floor(Math.random() * templates.length);
    return templates[randomIndex];
  }

  async getAllPromptTemplates(): Promise<PromptTemplateSelect[]> {
    return await db.select().from(promptTemplates).orderBy(desc(promptTemplates.createdAt));
  }

  async createPromptTemplate(template: PromptTemplateInsert): Promise<PromptTemplateSelect> {
    const [newTemplate] = await db.insert(promptTemplates).values(template).returning();
    return newTemplate;
  }

  async updatePromptTemplate(id: number, updates: Partial<PromptTemplateSelect>): Promise<PromptTemplateSelect | undefined> {
    const [updated] = await db.update(promptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promptTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async getPromptVariants(templateId: number): Promise<PromptVariantSelect[]> {
    return await db.select().from(promptVariants)
      .where(and(eq(promptVariants.templateId, templateId), eq(promptVariants.isActive, true)))
      .orderBy(desc(promptVariants.successRate));
  }

  async getBestPromptVariant(templateId: number): Promise<PromptVariantSelect | undefined> {
    const [variant] = await db.select().from(promptVariants)
      .where(and(eq(promptVariants.templateId, templateId), eq(promptVariants.isActive, true)))
      .orderBy(desc(promptVariants.successRate))
      .limit(1);
    return variant || undefined;
  }

  async createPromptVariant(variant: PromptVariantInsert): Promise<PromptVariantSelect> {
    const [newVariant] = await db.insert(promptVariants).values(variant).returning();
    return newVariant;
  }

  async updatePromptVariantStats(id: number, successRate: number): Promise<void> {
    await db.update(promptVariants)
      .set({ 
        successRate,
        timesUsed: sql`${promptVariants.timesUsed} + 1`
      })
      .where(eq(promptVariants.id, id));
  }
}

export const storage = new DatabaseStorage();
