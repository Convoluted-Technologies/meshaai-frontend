'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  rotation: number;
}

const FOOD_EMOJIS = ['🍳', '🥓', '🧀', '🌶️', '🍞', '🔥'];

export default function FoodCursor() {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeEmoji, setActiveEmoji] = useState<string>('🍳');

  useEffect(() => {
    let particleId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const isInteractive =
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.glass-panel') ||
        target.tagName === 'INPUT';
      setIsHovered(!!isInteractive);

      // Randomly spawn particle trail with low probability to avoid lag
      if (Math.random() < 0.25) {
        const randomEmoji = FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
        const newParticle: Particle = {
          id: particleId++,
          x: e.clientX + (Math.random() * 16 - 8),
          y: e.clientY + (Math.random() * 16 - 8),
          emoji: randomEmoji,
          size: Math.random() * 10 + 14,
          rotation: Math.random() * 360,
        };

        setParticles((prev) => [...prev.slice(-12), newParticle]);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Clean up old particles
    const interval = setInterval(() => {
      setParticles((prev) => prev.slice(1));
    }, 150);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  if (pos.x < 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden hidden md:block">
      {/* Particle Trail */}
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            fontSize: `${p.size}px`,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
          }}
          className="absolute animate-ping opacity-75 transition-opacity duration-500 select-none"
        >
          {p.emoji}
        </span>
      ))}

      {/* Main Following Food Cursor */}
      <div
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
        }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 flex items-center justify-center select-none ${isHovered ? 'scale-150 rotate-12' : 'scale-100'
          }`}
      >
        <span className="text-2xl drop-shadow-md filter drop-shadow-orange-500/50">
          {isHovered ? '🔥' : '🍳'}
        </span>
      </div>
    </div>
  );
}
