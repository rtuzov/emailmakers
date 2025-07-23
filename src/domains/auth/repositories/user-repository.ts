import { eq } from 'drizzle-orm';
import { db } from '@/shared/infrastructure/database/connection';
import { users, NewUser } from '@/shared/infrastructure/database/schema'; // UserSchema unused
import { User } from '../entities/user';

export interface UserRepository {
  create(userData: NewUser): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, userData: Partial<NewUser>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export class DrizzleUserRepository implements UserRepository {
  async create(userData: NewUser): Promise<User> {
    const [createdUser] = await db.insert(users).values({
      ...userData,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();

    if (!createdUser) {
      throw new Error('Failed to create user');
    }
    return User.fromSchema(createdUser);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? User.fromSchema(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ? User.fromSchema(user) : null;
  }

  async update(id: string, userData: Partial<NewUser>): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser ? User.fromSchema(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }
} 