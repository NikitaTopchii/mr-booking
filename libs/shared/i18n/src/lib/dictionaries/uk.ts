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
    title: 'Тижневий розклад',
    description:
      'Оберіть кімнату, знайдіть вільний час і забронюйте його у своєму часовому поясі.',
    roomLabel: 'Переговорна кімната',
    previousWeek: 'Попередній тиждень',
    currentWeek: 'Цей тиждень',
    nextWeek: 'Наступний тиждень',
    officeHours: 'Робочі години: 09:00–19:00 Europe/Kyiv',
    localTime: 'Час показано у вашому часовому поясі',
    loadingRooms: 'Завантажуємо переговорні кімнати…',
    loadingSchedule: 'Завантажуємо тижневий розклад…',
    emptyRooms: 'Немає доступних переговорних кімнат.',
    emptySchedule:
      'Цього тижня бронювань немає. Вільні слоти доступні для бронювання.',
    retry: 'Спробувати знову',
    available: 'Вільно',
    unavailable: 'Недоступно',
    yourBooking: 'Ваше бронювання',
    bookedBy: 'Автор',
    bookingTitle: 'Забронювати кімнату',
    bookingDetails: 'Деталі бронювання',
    titleLabel: 'Назва зустрічі',
    startLabel: 'Початок',
    endLabel: 'Завершення',
    roomDetailsLabel: 'Кімната',
    create: 'Забронювати',
    creating: 'Бронюємо…',
    cancel: 'Скасувати',
    cancelBooking: 'Скасувати бронювання',
    cancelling: 'Скасовуємо…',
    keepBooking: 'Залишити бронювання',
    close: 'Закрити діалог',
    requiredTitle: 'Введіть назву зустрічі.',
    invalidEnd: 'Оберіть час завершення після початку.',
    cancelConfirmation:
      'Кімната знову стане доступною для всіх. Цю дію неможливо скасувати.',
    successCreated: 'Бронювання створено.',
    successCancelled: 'Бронювання скасовано.',
    errors: {
      rooms: 'Не вдалося завантажити переговорні кімнати.',
      schedule: 'Не вдалося завантажити цей розклад.',
      conflict: 'Цей час щойно забронювали. Розклад оновлено.',
      past: 'Бронювання має починатися в майбутньому.',
      outsideHours: 'Оберіть час у межах робочих годин.',
      duration: 'Бронювання має складатися з 30-хвилинних слотів.',
      validation: 'Перевірте дані бронювання та спробуйте ще раз.',
      forbidden: 'Лише автор бронювання може його скасувати.',
      notFound: 'Це бронювання більше недоступне.',
      generic: 'Щось пішло не так. Спробуйте ще раз.',
    },
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
