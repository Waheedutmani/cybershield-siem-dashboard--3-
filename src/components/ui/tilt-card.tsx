'use client';

import React, { useRef, useState, useCallback, type ReactNode, type HTMLAttributes } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  intensity?: number;
  glowColor?: string;
  className?: string;
  floatOnHover?: boolean;
}

export function TiltCard({
  children,
  intensity = 10,
  glowColor = 'rgba(0,212,255,0.2)',
  className,
  floatOnHover = true,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 250, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-intensity, intensity]), springConfig);

  // Scale spring for smooth hover scale
  const scaleSpring = useSpring(1, { damping: 20, stiffness: 300 });

  const glowX = useTransform(mouseX, [0, 1], ['0%', '100%']);
  const glowY = useTransform(mouseY, [0, 1], ['0%', '100%']);

  // Glossy light reflection overlay position
  const shineX = useTransform(mouseX, [0, 1], [-50, 150]);
  const shineY = useTransform(mouseY, [0, 1], [-50, 150]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mouseX.set(Math.max(0, Math.min(1, x)));
      mouseY.set(Math.max(0, Math.min(1, y)));
    },
    [mouseX, mouseY]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    scaleSpring.set(floatOnHover ? 1.03 : 1.01);
  }, [scaleSpring, floatOnHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
    scaleSpring.set(1);
  }, [mouseX, mouseY, scaleSpring]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      className={cn('relative', className)}
      {...props}
    >
      {/* Outer wrapper for 3D rotation */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          scale: scaleSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
      >
        {/* Animated glowing border that follows mouse */}
        <motion.div
          className="absolute -inset-[1px] rounded-[inherit] opacity-0 transition-opacity duration-500 pointer-events-none z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(500px circle at ${glowX} ${glowY}, ${glowColor}, transparent 50%)`,
          }}
        />

        {/* Secondary outer glow ring */}
        <motion.div
          className="absolute -inset-[2px] rounded-[inherit] pointer-events-none z-0"
          style={{
            opacity: isHovered ? 0.5 : 0,
            boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor.replace(/[\d.]+\)$/, '0.08)')}`,
            transition: 'opacity 0.5s ease',
          }}
        />

        {/* Bottom depth shadow layer */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.3) 100%)',
            transform: 'translateY(4px)',
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Card content */}
        <div className="relative z-10" style={{ transform: 'translateZ(0)' }}>
          {children}
        </div>

        {/* Glossy light reflection overlay */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20 overflow-hidden"
          style={{
            background: isHovered
              ? `radial-gradient(
                  300px circle at ${shineX}% ${shineY}%,
                  rgba(255,255,255,0.08) 0%,
                  rgba(255,255,255,0.03) 30%,
                  transparent 60%
                )`
              : 'none',
          }}
        />

        {/* Edge highlight on top-left for 3D depth illusion */}
        <motion.div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-20"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)',
            transition: 'opacity 0.4s ease',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
