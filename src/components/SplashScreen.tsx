'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onFinished?: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const [stage, setStage] = useState<'loading' | 'fading' | 'gone'>('loading');
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 20) + 10;
      });
    }, 120);

    // Fade out after minimum display duration for cinematic feel
    const fadeTimer = setTimeout(() => {
      setStage('fading');
      if (onFinished) onFinished();
    }, 850);

    // Remove from DOM after fade transition completes
    const removeTimer = setTimeout(() => {
      setStage('gone');
    }, 1250);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinished]);

  if (stage === 'gone') return null;

  return (
    <div
      className={`splash-screen ${stage === 'fading' ? 'fade-out' : ''}`}
      aria-label="EightbornV Yükleniyor"
    >
      <div className="splash-ambient-aura" />

      <div className="splash-content">
        {/* Eightborn Crest Logo with Golden Glow */}
        <div className="splash-logo-wrap">
          <Image
            src="/eightborn-logo.png"
            alt="Eightborn V"
            width={72}
            height={72}
            priority
            unoptimized
            className="splash-logo-img"
          />
        </div>

        {/* Brand Typography */}
        <div className="splash-text-group" lang="en">
          <h1 className="splash-title">EIGHTBORN V</h1>
          <p className="splash-subtitle">WATCHPARTY OPERASYON MERKEZİ</p>
        </div>

        {/* Tactical Loader Bar */}
        <div className="splash-progress-track">
          <div
            className="splash-progress-fill"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        <div className="splash-status-text">
          Sistemler ve yayın kanalları bağlanıyor...
        </div>
      </div>
    </div>
  );
}
