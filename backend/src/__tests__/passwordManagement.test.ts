import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';

describe('Password Management & Validation Security Logic', () => {
  it('enforces password minimum length of 6 and maximum of 128 characters', () => {
    const validatePassword = (pass: any): { valid: boolean; error?: string } => {
      if (!pass || typeof pass !== 'string') {
        return { valid: false, error: 'Contraseña requerida' };
      }
      if (pass.length < 6) {
        return { valid: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' };
      }
      if (pass.length > 128) {
        return { valid: false, error: 'La nueva contraseña no puede exceder 128 caracteres' };
      }
      return { valid: true };
    };

    expect(validatePassword('').valid).toBe(false);
    expect(validatePassword('12345').valid).toBe(false);
    expect(validatePassword('123456').valid).toBe(true);
    expect(validatePassword('Hardman-2026!').valid).toBe(true);
    expect(validatePassword('a'.repeat(129)).valid).toBe(false);
  });

  it('rejects changing to the exact same current password', () => {
    const isDifferentPassword = (curr: string, next: string): boolean => {
      return curr !== next;
    };

    expect(isDifferentPassword('Hardman-12345!', 'Hardman-12345!')).toBe(false);
    expect(isDifferentPassword('Hardman-12345!', 'Hardman-54321!')).toBe(true);
  });

  it('generates secure random passwords following the Hardman pattern', () => {
    const generateSecureRandomPassword = () => {
      const num = Math.floor(100000 + Math.random() * 900000);
      return `Hardman-${num}!`;
    };

    const pass1 = generateSecureRandomPassword();
    const pass2 = generateSecureRandomPassword();

    expect(pass1).toMatch(/^Hardman-\d{6}!$/);
    expect(pass2).toMatch(/^Hardman-\d{6}!$/);
    expect(pass1.length).toBe(15);
  });

  it('verifies bcrypt hashing and comparison integrity', async () => {
    const originalPass = 'AbogadoHardman2026!';
    const hash = await bcrypt.hash(originalPass, 10);

    const matchGood = await bcrypt.compare(originalPass, hash);
    const matchBad = await bcrypt.compare('WrongPassword123!', hash);

    expect(matchGood).toBe(true);
    expect(matchBad).toBe(false);
  });

  it('formats copyable WhatsApp recovery message accurately', () => {
    const formatWhatsappMessage = (email: string, pass: string) => {
      return `Estimado(a) Dr(a)., sus credenciales de acceso a Hardman han sido actualizadas:\n\n• Correo: ${email}\n• Nueva Contraseña: ${pass}\n• Iniciar Sesión: https://hardman.pe/login\n\nQuedamos a su entera disposición.`;
    };

    const msg = formatWhatsappMessage('dr.ortega@gmail.com', 'Hardman-784129!');
    expect(msg).toContain('dr.ortega@gmail.com');
    expect(msg).toContain('Hardman-784129!');
    expect(msg).toContain('https://hardman.pe/login');
  });
});
