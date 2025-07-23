import { eq, and, gt, lt } from 'drizzle-orm'; // sql unused
import { db } from '@/shared/infrastructure/database/connection';
import { sessions, Session as SessionSchema, NewSession } from '@/shared/infrastructure/database/schema';

export interface SessionRepository {
  create(sessionData: Omit<NewSession, 'id' | 'created_at'>): Promise<SessionSchema>;
  findByToken(token: string): Promise<SessionSchema | null>;
  findByUserId(userId: string): Promise<SessionSchema[]>;
  invalidateUserSessions(userId: string): Promise<void>;
  invalidateExpiredSessions(): Promise<void>;
  delete(id: string): Promise<boolean>;
}

export class DrizzleSessionRepository implements SessionRepository {
  async create(sessionData: Omit<NewSession, 'id' | 'created_at'>): Promise<SessionSchema> {
    const [createdSession] = await db.insert(sessions).values({
      user_id: sessionData.user_id,
      token: sessionData.token,
      expires_at: sessionData.expires_at,
    }).returning();

    if (!createdSession) {
      throw new Error('Failed to create session');
    }

    return createdSession;
  }

  async findByToken(token: string): Promise<SessionSchema | null> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          // Only return non-expired sessions
          gt(sessions.expires_at, new Date())
        )
      );
    
    return session || null;
  }

  async findByUserId(userId: string): Promise<SessionSchema[]> {
    return db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.user_id, userId),
          // Only return non-expired sessions
          gt(sessions.expires_at, new Date())
        )
      );
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.user_id, userId));
  }

  async invalidateExpiredSessions(): Promise<void> {
    await db
      .delete(sessions)
      .where(lt(sessions.expires_at, new Date()));
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(sessions).where(eq(sessions.id, id));
    return true;
  }
} 