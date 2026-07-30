'use client';

import { useEffect, useState } from 'react';

export function useBrowserTimeZone(): string {
  const [timeZone, setTimeZone] = useState('UTC');

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  }, []);

  return timeZone;
}
