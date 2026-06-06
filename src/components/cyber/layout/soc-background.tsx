'use client';

import { useAppStore, type PageType } from '@/store/app-store';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Background configuration per page category
type BackgroundCategory = 'login' | 'soc-main' | 'data-stream' | 'minimal';

const pageBackgroundMap: Record<PageType, BackgroundCategory> = {
  dashboard: 'soc-main',
  logs: 'data-stream',
  alerts: 'data-stream',
  analytics: 'soc-main',
  simulation: 'soc-main',
  users: 'minimal',
  settings: 'minimal',
  attackmap: 'soc-main',
  timeline: 'data-stream',
  firewall: 'soc-main',
  monitoring: 'soc-main',
  search: 'data-stream',
  sessions: 'data-stream',
  statistics: 'soc-main',
  profile: 'minimal',
};

const bgImages: Record<BackgroundCategory, string> = {
  'login': '/images/bg-login.png',
  'soc-main': '/images/bg-dashboard.png',
  'data-stream': '/images/bg-logs-alerts.png',
  'minimal': '/images/bg-minimal.png',
};

const overlayConfig: Record<BackgroundCategory, {
  darkOpacity: number;
  blur: number;
  gridOpacity: number;
  particleCount: number;
  dataStreamEnabled: boolean;
  scanLineEnabled: boolean;
}> = {
  'login': {
    darkOpacity: 0.82,
    blur: 2,
    gridOpacity: 0.25,
    particleCount: 12,
    dataStreamEnabled: false,
    scanLineEnabled: true,
  },
  'soc-main': {
    darkOpacity: 0.68,
    blur: 3,
    gridOpacity: 0.12,
    particleCount: 20,
    dataStreamEnabled: true,
    scanLineEnabled: true,
  },
  'data-stream': {
    darkOpacity: 0.76,
    blur: 2,
    gridOpacity: 0.10,
    particleCount: 15,
    dataStreamEnabled: true,
    scanLineEnabled: false,
  },
  'minimal': {
    darkOpacity: 0.84,
    blur: 1,
    gridOpacity: 0.06,
    particleCount: 8,
    dataStreamEnabled: false,
    scanLineEnabled: false,
  },
};

// Generate particle positions (memoized for performance)
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    speed: 15 + Math.random() * 35,
    delay: Math.random() * 20,
    opacity: 0.03 + Math.random() * 0.06,
  }));
}

// Generate data stream lines
function generateDataStreams(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 5 + Math.random() * 90,
    speed: 6 + Math.random() * 14,
    delay: Math.random() * 10,
    opacity: 0.02 + Math.random() * 0.04,
    width: 1 + Math.random() * 2,
    length: 15 + Math.random() * 30,
  }));
}

interface SOCBackgroundProps {
  page?: PageType | 'login' | 'register';
  children?: React.ReactNode;
}

export function SOCBackground({ page, children }: SOCBackgroundProps) {
  const currentPage = useAppStore((s) => s.currentPage);
  const theme = useAppStore((s) => s.theme);
  const [activeBg, setActiveBg] = useState<BackgroundCategory>('soc-main');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // Determine the background category for the current page
  const getCategory = useCallback((): BackgroundCategory => {
    if (page === 'login' || page === 'register') return 'login';
    if (page) return pageBackgroundMap[page] || 'soc-main';
    return pageBackgroundMap[currentPage] || 'soc-main';
  }, [page, currentPage]);

  const category = getCategory();
  const config = overlayConfig[category];
  const bgSrc = bgImages[category];

  // Memoize particle and data stream generation
  const particles = useMemo(() => generateParticles(config.particleCount), [config.particleCount]);
  const dataStreams = useMemo(() => generateDataStreams(8), []);

  // Smooth transition between backgrounds
  useEffect(() => {
    if (activeBg !== category) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setActiveBg(category);
        setIsTransitioning(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [category, activeBg]);

  // Theme accent color for overlay tinting
  const accentRgb = theme === 'matrix-green'
    ? '0, 255, 136'
    : theme === 'neon-blue'
      ? '34, 211, 238'
      : '0, 212, 255';

  if (!mounted) {
    return <div className="min-h-screen bg-cyber-dark">{children}</div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== LAYER 1: Background Image ===== */}
      <div className="absolute inset-0">
        <Image
          src={bgSrc}
          alt=""
          fill
          className={cn(
            'object-cover object-center transition-all duration-1000 ease-out',
            isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          )}
          priority
          quality={90}
          sizes="100vw"
        />
      </div>

      {/* ===== LAYER 2: Primary Dark Overlay ===== */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(10, 14, 26, ${config.darkOpacity - 0.05}) 0%, rgba(10, 14, 26, ${config.darkOpacity}) 50%),
            linear-gradient(180deg,
              rgba(6, 8, 16, ${config.darkOpacity + 0.04}) 0%,
              rgba(10, 14, 26, ${config.darkOpacity}) 30%,
              rgba(10, 14, 26, ${config.darkOpacity - 0.03}) 70%,
              rgba(6, 8, 16, ${config.darkOpacity + 0.06}) 100%
            )
          `,
        }}
      />

      {/* ===== LAYER 3: Blur Pass ===== */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ backdropFilter: `blur(${config.blur}px)` }}
      />

      {/* ===== LAYER 4: Theme Accent Color Wash ===== */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(ellipse at 25% 15%, rgba(${accentRgb}, 0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 85%, rgba(${accentRgb}, 0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(${accentRgb}, 0.01) 0%, transparent 70%)
          `,
        }}
      />

      {/* ===== LAYER 5: Vignette for depth ===== */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0, 0, 0, 0.15) 65%, rgba(0, 0, 0, 0.45) 100%)
          `,
        }}
      />

      {/* ===== LAYER 6: Cyber Grid Pattern ===== */}
      <div
        className={cn('absolute inset-0 pointer-events-none transition-opacity duration-700')}
        style={{ opacity: config.gridOpacity }}
      >
        <div className="absolute inset-0 cyber-grid-bg" />
        {/* Hex pattern overlay for SOC pages */}
        {category === 'soc-main' && (
          <div className="absolute inset-0 hex-pattern-bg opacity-50" />
        )}
      </div>

      {/* ===== LAYER 7: Animated Scan Line (SOC & Login) ===== */}
      {config.scanLineEnabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Primary scan line */}
          <div
            className="absolute left-0 right-0 h-[1px] animate-[scan-line_8s_linear_infinite]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, rgba(${accentRgb}, 0.15) 20%, rgba(${accentRgb}, 0.3) 50%, rgba(${accentRgb}, 0.15) 80%, transparent 100%)`,
            }}
          />
          {/* Secondary faint scan line */}
          <div
            className="absolute left-0 right-0 h-[1px] animate-[scan-line_12s_linear_infinite] opacity-50"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${accentRgb}, 0.1), transparent)`,
              animationDelay: '-4s',
            }}
          />
        </div>
      )}

      {/* ===== LAYER 8: Data Stream Lines (SOC & Data pages) ===== */}
      {config.dataStreamEnabled && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {dataStreams.map((stream) => (
            <div
              key={stream.id}
              className="absolute top-0 bottom-0"
              style={{
                left: `${stream.left}%`,
                opacity: stream.opacity,
              }}
            >
              <div
                className="w-full h-full animate-[data-stream_${stream.speed}s_linear_infinite]"
                style={{
                  animationDelay: `-${stream.delay}s`,
                  background: `linear-gradient(180deg, transparent 0%, rgba(${accentRgb}, 0.3) ${stream.length}%, transparent ${stream.length + 10}%)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ===== LAYER 9: Floating Ambient Particles ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: `radial-gradient(circle, rgba(${accentRgb}, 0.8), transparent 70%)`,
              opacity: p.opacity,
              animation: `float-particle ${p.speed}s ease-in-out infinite`,
              animationDelay: `-${p.delay}s`,
            }}
          />
        ))}
        {/* Large ambient glow orbs for depth */}
        <div
          className="absolute w-[500px] h-[500px] -top-[150px] -left-[150px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb}, 0.08), transparent 70%)`,
            opacity: 0.04,
            animation: 'float-particle 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] top-[40%] -right-[100px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb}, 0.06), transparent 70%)`,
            opacity: 0.03,
            animation: 'float-particle 30s ease-in-out infinite reverse',
          }}
        />
        <div
          className="absolute w-[450px] h-[450px] -bottom-[120px] left-[25%] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb}, 0.05), transparent 70%)`,
            opacity: 0.03,
            animation: 'float-particle 35s ease-in-out infinite',
            animationDelay: '-10s',
          }}
        />
      </div>

      {/* ===== LAYER 10: Corner accent glows (SOC main only) ===== */}
      {category === 'soc-main' && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Top-left accent */}
          <div
            className="absolute -top-20 -left-20 w-60 h-60 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(${accentRgb}, 0.06), transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
          {/* Bottom-right accent */}
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(${accentRgb}, 0.04), transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
          {/* Top-right secondary accent */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(168, 85, 247, 0.04), transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
        </div>
      )}

      {/* ===== LAYER 11: Noise texture for realism ===== */}
      <div className="absolute inset-0 pointer-events-none noise-texture opacity-[0.015]" />

      {/* ===== CONTENT LAYER - sits above all background layers ===== */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
