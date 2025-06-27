import crypto from 'crypto';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;

  constructor(private secretKey: string) {
    if (secretKey.length !== EncryptionService.KEY_LENGTH) {
      throw new Error('Secret key must be 32 characters long');
    }
  }

  encrypt(text: string): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(EncryptionService.ALGORITHM, this.secretKey);
    cipher.setAAD(Buffer.from('email-makers'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    const decipher = crypto.createDecipher(EncryptionService.ALGORITHM, this.secretKey);
    decipher.setAAD(Buffer.from('email-makers'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static generateSecretKey(): string {
    return crypto.randomBytes(EncryptionService.KEY_LENGTH).toString('hex').slice(0, EncryptionService.KEY_LENGTH);
  }
} 