import { type User, type InsertUser, type PetTransformation, type InsertPetTransformation, users, petTransformations } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
      .values([insertTransformation])
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
}

export const storage = new DatabaseStorage();
