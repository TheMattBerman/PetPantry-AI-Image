import { type User, type InsertUser, type PetTransformation, type InsertPetTransformation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pet transformation methods
  getPetTransformation(id: string): Promise<PetTransformation | undefined>;
  createPetTransformation(transformation: InsertPetTransformation): Promise<PetTransformation>;
  updatePetTransformationStats(id: string, stats: { likes: number; shares: number; downloads: number }): Promise<void>;
  getUserTransformations(userId: string): Promise<PetTransformation[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private petTransformations: Map<string, PetTransformation>;

  constructor() {
    this.users = new Map();
    this.petTransformations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getPetTransformation(id: string): Promise<PetTransformation | undefined> {
    return this.petTransformations.get(id);
  }

  async createPetTransformation(insertTransformation: InsertPetTransformation): Promise<PetTransformation> {
    const id = randomUUID();
    const transformation: PetTransformation = {
      ...insertTransformation,
      id,
      stats: { likes: 0, shares: 0, downloads: 0 },
      transformedImageUrl: null,
      createdAt: new Date(),
    };
    this.petTransformations.set(id, transformation);
    return transformation;
  }

  async updatePetTransformationStats(id: string, stats: { likes: number; shares: number; downloads: number }): Promise<void> {
    const transformation = this.petTransformations.get(id);
    if (transformation) {
      transformation.stats = stats;
      this.petTransformations.set(id, transformation);
    }
  }

  async getUserTransformations(userId: string): Promise<PetTransformation[]> {
    return Array.from(this.petTransformations.values()).filter(t => t.userId === userId);
  }
}

export const storage = new MemStorage();
