import { bookingCancellationErrorCatalog } from './booking-cancellation-error.catalog';
import { bookingCreationErrorCatalog } from './booking-creation-error.catalog';
import { resolveFeatureErrorMessage } from './resolve-schedule-error-message';

const localizedMessages = {
  uk: {
    rooms: 'Не вдалося завантажити переговорні.',
    schedule: 'Не вдалося завантажити розклад.',
    roomNotFound: 'Ця переговорна недоступна.',
    creation: {
      conflict: 'Конфлікт.',
      startNotInFuture: 'Майбутнє.',
      outsideHours: 'Робочі години.',
      invalidDuration: 'Тривалість.',
      invalidSlotAlignment: 'Крок.',
      titleRequired: 'Назва.',
      titleTooLong: 'Назва задовга.',
      validation: 'Перевірка.',
      roomNotFound: 'Переговорна.',
      emailVerificationRequired: 'Пошта.',
      generic: 'Сервіс.',
    },
    cancellation: {
      notCancellable: 'Не можна скасувати.',
      forbidden: 'Заборонено.',
      notFound: 'Немає.',
      generic: 'Сервіс.',
    },
  },
  en: {
    rooms: 'Rooms failed.',
    schedule: 'Schedule failed.',
    roomNotFound: 'Room unavailable.',
    creation: {
      conflict: 'Conflict.',
      startNotInFuture: 'Future.',
      outsideHours: 'Office hours.',
      invalidDuration: 'Duration.',
      invalidSlotAlignment: 'Alignment.',
      titleRequired: 'Title.',
      titleTooLong: 'Title too long.',
      validation: 'Validation.',
      roomNotFound: 'Room.',
      emailVerificationRequired: 'Email.',
      generic: 'Service.',
    },
    cancellation: {
      notCancellable: 'Not cancellable.',
      forbidden: 'Forbidden.',
      notFound: 'Not found.',
      generic: 'Service.',
    },
  },
} as const;

describe('resolveFeatureErrorMessage', () => {
  it.each([
    ['ukrainian', localizedMessages.uk],
    ['english', localizedMessages.en],
  ])('resolves all creation keys in the %s dictionary', (_locale, errors) => {
    for (const metadata of Object.values(bookingCreationErrorCatalog)) {
      expect(
        resolveFeatureErrorMessage(metadata, errors.creation),
      ).toBeTruthy();
    }
  });

  it.each([
    ['ukrainian', localizedMessages.uk.cancellation],
    ['english', localizedMessages.en.cancellation],
  ])(
    'resolves all cancellation keys in the %s dictionary',
    (_locale, errors) => {
      for (const metadata of Object.values(bookingCancellationErrorCatalog)) {
        expect(resolveFeatureErrorMessage(metadata, errors)).toBeTruthy();
      }
    },
  );

  it('resolves query messages without a presentation switch', () => {
    expect(
      resolveFeatureErrorMessage(
        { messageKey: 'roomNotFound' },
        localizedMessages.uk,
      ),
    ).toBe('Ця переговорна недоступна.');
  });
});
