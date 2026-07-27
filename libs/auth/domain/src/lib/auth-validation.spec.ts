import {
  AuthValidationError,
  cleanEmail,
  normalizeEmail,
  parseRegistrationInput,
  toSafeUser,
} from '..';

describe('authentication domain rules', () => {
  it.each([
    ['Ivan@x.com', 'ivan@x.com'],
    ['ivan@x.com', 'ivan@x.com'],
    ['  IVAN@x.com  ', 'ivan@x.com'],
  ])('normalizes %s to %s', (email, expected) => {
    expect(normalizeEmail(email)).toBe(expected);
  });

  it('cleans display email without changing its case', () => {
    expect(cleanEmail('  Alice@Example.com ')).toBe('Alice@Example.com');
  });

  it('trims names and accepts Unicode names', () => {
    const result = parseRegistrationInput({
      name: '  Марія 🌻  ',
      email: 'maria@example.com',
      password: 'password',
    });

    expect(result.name).toBe('Марія 🌻');
  });

  it('rejects a name that is empty after trimming', () => {
    try {
      parseRegistrationInput({
        name: '   ',
        email: 'alice@example.com',
        password: 'password',
      });
      throw new Error('Expected registration validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthValidationError);
      expect((error as AuthValidationError).fields.name).toBe('NAME_REQUIRED');
    }
  });

  it.each([
    [{ name: 'Alice', email: '', password: 'password123' }, 'EMAIL_REQUIRED'],
    [
      { name: 'Alice', email: 'not-an-email', password: 'password123' },
      'EMAIL_INVALID',
    ],
    [
      { name: 'Alice', email: 'alice@example.com', password: '' },
      'PASSWORD_REQUIRED',
    ],
  ])('returns stable field codes instead of prose', (input, expectedCode) => {
    try {
      parseRegistrationInput(input);
      throw new Error('Expected registration validation to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthValidationError);
      const validationError = error as AuthValidationError;
      expect(Object.values(validationError.fields)).toContain(expectedCode);
      expect(Object.values(validationError.fields).join(' ')).not.toMatch(
        /enter|password must/iu,
      );
    }
  });

  it.each([
    ['1234567', false],
    ['12345678', true],
    ['a'.repeat(72), true],
    ['a'.repeat(73), false],
  ])('validates password boundary for %s characters', (password, valid) => {
    const operation = () =>
      parseRegistrationInput({
        name: 'Alice',
        email: 'alice@example.com',
        password,
      });

    if (valid) {
      expect(operation().password).toBe(password);
    } else {
      try {
        operation();
        throw new Error('Expected password validation to fail');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthValidationError);
        expect((error as AuthValidationError).fields.password).toBe(
          'PASSWORD_LENGTH',
        );
      }
    }
  });

  it('does not trim passwords', () => {
    const password = ' pass123 ';
    expect(
      parseRegistrationInput({
        name: 'Alice',
        email: 'alice@example.com',
        password,
      }).password,
    ).toBe(password);
  });

  it('maps credentials to a safe user without the password hash', () => {
    expect(
      toSafeUser({
        id: 'alice',
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash: 'secret-hash',
      }),
    ).toEqual({
      id: 'alice',
      name: 'Alice',
      email: 'alice@example.com',
    });
  });
});
