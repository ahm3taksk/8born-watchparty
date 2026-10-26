'use client';

import React from 'react';
import { useWatchpartyStore } from '@/store/useWatchpartyStore';

export function Toasts() {
  const toasts = useWatchpartyStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast-pill">
          {t.text}
        </div>
      ))}
    </div>
  );
}
