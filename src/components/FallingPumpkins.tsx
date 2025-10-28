'use client';

import { useMemo } from 'react';

const PUMPKIN_COUNT = 18;

interface PumpkinConfig {
  id: string;
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
}

function createPumpkins(): PumpkinConfig[] {
  return Array.from({ length: PUMPKIN_COUNT }, (_, index) => ({
    id: `pumpkin-${index}`,
    left: Math.random() * 100,
    delay: Math.random() * -15,
    duration: 14 + Math.random() * 12,
    size: 1.75 + Math.random() * 1.5,
    drift: (Math.random() - 0.5) * 80,
  }));
}

export default function FallingPumpkins() {
  const pumpkins = useMemo(() => createPumpkins(), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {pumpkins.map((pumpkin) => (
        <span
          key={pumpkin.id}
          className="pumpkin-fall absolute select-none"
          style={{
            left: `${pumpkin.left}%`,
            fontSize: `${pumpkin.size}rem`,
            animationDuration: `${pumpkin.duration}s`,
            animationDelay: `${pumpkin.delay}s`,
            ['--pumpkin-drift' as const]: `${pumpkin.drift}px`,
          }}
        >
          🎃
        </span>
      ))}
    </div>
  );
}
