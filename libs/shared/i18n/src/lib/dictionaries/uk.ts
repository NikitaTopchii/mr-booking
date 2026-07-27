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
  },
  appShell: {
    productName: 'MR Booking',
    skipToContent: 'Перейти до основного вмісту',
    navigation: {
      label: 'Основна навігація',
      schedule: 'Розклад',
      myBookings: 'Мої бронювання',
    },
    userMenu: {
      open: 'Відкрити меню користувача',
      signedInAs: 'Ви ввійшли як',
      language: 'Мова інтерфейсу',
      logout: 'Вийти',
      loggingOut: 'Виходимо…',
      logoutError: 'Не вдалося вийти. Спробуйте ще раз.',
    },
  },
  schedule: {
    scheduleTitle: 'Розклад готовий до наступного етапу',
    scheduleDescription:
      'Автентифікація працює. Календар і бронювання будуть реалізовані окремою фазою.',
  },
  myBookings: {
    title: 'Мої бронювання',
    description:
      'Тут будуть зібрані ваші майбутні та минулі бронювання переговорних кімнат.',
    upcoming: {
      title: 'Майбутні',
      emptyTitle: 'Майбутніх бронювань поки немає.',
      emptyDescription:
        'Після підключення даних тут з’являться найближчі підтверджені бронювання.',
    },
    past: {
      title: 'Минулі',
      emptyTitle: 'Минулі бронювання з’являться тут.',
      emptyDescription:
        'Історію буде підключено до авторитетних даних у наступній фазі бронювань.',
    },
    actions: {
      viewSchedule: 'Перейти до розкладу',
    },
  },
} satisfies AppDictionary;
