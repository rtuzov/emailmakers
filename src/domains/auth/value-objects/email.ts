export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(private readonly value: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.value) {
      throw new Error('Email cannot be empty');
    }

    if (!Email.EMAIL_REGEX.test(this.value)) {
      throw new Error('Invalid email format');
    }

    if (this.value.length > 255) {
      throw new Error('Email cannot exceed 255 characters');
    }
  }

  get address(): string {
    return this.value;
  }

  get domain(): string {
    return this.value.split('@')[1] || '';
  }

  get localPart(): string {
    return this.value.split('@')[0] || '';
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
} 