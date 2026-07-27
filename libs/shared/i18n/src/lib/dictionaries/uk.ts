import type { AppDictionary } from '../dictionary';

export const dictionary = {
  metadata: {
    description: 'Зручне бронювання переговорних кімнат',
    loginTitle: 'Вхід · MR Booking',
    registerTitle: 'Реєстрація · MR Booking',
  },
  common: {
    serviceUnavailable:
      'Сервіс тимчасово недоступний. Спробуйте ще раз за хвилину.',
    networkError:
      'Не вдалося з’єднатися із сервісом. Перевірте мережу й повторіть спробу.',
  },
  auth: {
    language: {
      label: 'Мова',
      ukrainian: 'Українська',
      english: 'English',
    },
    login: {
      title: 'Раді знову бачити',
      description: 'Увійдіть, щоб перейти до бронювання переговорних кімнат.',
      emailLabel: 'Електронна пошта',
      passwordLabel: 'Пароль',
      submit: 'Увійти',
      submitting: 'Входимо…',
      switchText: 'Ще не маєте акаунта?',
      switchAction: 'Зареєструватися',
    },
    register: {
      title: 'Створіть акаунт',
      description: 'Один короткий крок — і робочий розклад буде доступний.',
      nameLabel: 'Ім’я',
      emailLabel: 'Електронна пошта',
      passwordLabel: 'Пароль',
      passwordHint: 'Від 8 до 72 символів. Пробіли дозволені.',
      submit: 'Створити акаунт',
      submitting: 'Створюємо…',
      switchText: 'Вже маєте акаунт?',
      switchAction: 'Увійти',
    },
    logout: {
      action: 'Вийти',
      submitting: 'Виходимо…',
      error: 'Не вдалося вийти. Спробуйте ще раз.',
    },
    errors: {
      invalidCredentials: 'Неправильна електронна пошта або пароль.',
      unauthenticated: 'Для продовження увійдіть до акаунта.',
      serviceUnavailable:
        'Сервіс тимчасово недоступний. Спробуйте ще раз за хвилину.',
      network:
        'Не вдалося з’єднатися із сервісом. Перевірте мережу й повторіть спробу.',
      fields: {
        NAME_REQUIRED: 'Введіть ім’я.',
        EMAIL_REQUIRED: 'Введіть електронну пошту.',
        EMAIL_INVALID: 'Введіть коректну електронну пошту.',
        PASSWORD_REQUIRED: 'Введіть пароль.',
        PASSWORD_LENGTH: 'Пароль має містити від 8 до 72 символів.',
        EMAIL_ALREADY_EXISTS: 'Акаунт із цією електронною поштою вже існує.',
      },
    },
  },
  application: {
    serviceUnavailableTitle: 'Сервіс тимчасово недоступний',
    serviceUnavailableDescription:
      'Не вдалося перевірити сесію. Оновіть сторінку за хвилину.',
    userMenuLabel: 'Поточний користувач',
    protectedEyebrow: 'Захищена область',
    scheduleTitle: 'Розклад готовий до наступного етапу',
    scheduleDescription:
      'Автентифікація працює. Календар і бронювання будуть реалізовані окремою фазою.',
  },
} satisfies AppDictionary;
