export function resolveFeatureErrorMessage<MessageKey extends string>(
  error: { readonly messageKey: MessageKey },
  messages: Readonly<Record<MessageKey, string>>,
): string {
  return messages[error.messageKey];
}
