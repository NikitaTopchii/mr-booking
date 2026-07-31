import { Argon2PasswordHasher } from './argon2-password-hasher';
import {
  CryptoSessionTokenGenerator,
  Sha256SessionTokenHasher,
} from './session-token-adapters';

describe('authentication security adapters', () => {
  it('generates independent tokens with at least 256 bits of entropy', () => {
    const generator = new CryptoSessionTokenGenerator();
    const first = generator.generate();
    const second = generator.generate();

    expect(first).not.toBe(second);
    expect(first).toHaveLength(43);
    expect(Buffer.from(first, 'base64url')).toHaveLength(32);
  });

  it('hashes session tokens deterministically with SHA-256', () => {
    const hasher = new Sha256SessionTokenHasher();

    expect(hasher.hash('raw-token')).toBe(
      '34d328009b123fbbb0dc93f18b3e6de1ecf7b1a5783c33dff7ffe1926f09e943',
    );
    expect(hasher.hash('raw-token')).toHaveLength(64);
    expect(hasher.hash('raw-token')).not.toBe('raw-token');
  });

  it('hashes and verifies passwords with Argon2id', async () => {
    const hasher = new Argon2PasswordHasher();
    const passwordHash = await hasher.hash('password123');

    expect(passwordHash.startsWith('$argon2id$')).toBe(true);
    await expect(hasher.verify(passwordHash, 'password123')).resolves.toBe(
      true,
    );
    await expect(hasher.verify(passwordHash, 'different')).resolves.toBe(false);
  });
});
