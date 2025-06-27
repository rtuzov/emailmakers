import { User as UserSchema } from '@/shared/infrastructure/database/schema';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly firstName: string | null,
    public readonly lastName: string | null,
    public readonly role: string,
    public readonly emailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromSchema(schema: UserSchema): User {
    return new User(
      schema.id,
      schema.email,
      schema.password_hash,
      schema.first_name,
      schema.last_name,
      schema.role,
      schema.email_verified ?? false,
      schema.created_at,
      schema.updated_at
    );
  }

  get fullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.firstName || this.lastName || this.email;
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isVerified(): boolean {
    return this.emailVerified;
  }
} 