/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export default function NexusCoreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Ultra-quiet ambient particles
    const particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const particleCount = 25; // Drastically reduced for calm visual rhythm

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.08 + 0.02, // Extremely slow drift
        opacity: Math.random() * 0.15 + 0.05,
      });
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Check current theme dynamically
      const isLightMode = document.body.classList.contains('light') || 
                          localStorage.getItem('nexus_theme') === 'light' ||
                          (canvas.parentElement?.parentElement?.className.includes('bg-slate-50') ?? false);

      // Draw subtle tech grid
      const gridSize = 64;
      ctx.lineWidth = 0.5;
      
      // Theme-aware grid color (ultra-subtle)
      ctx.strokeStyle = isLightMode 
        ? 'rgba(0, 0, 0, 0.015)' 
        : 'rgba(239, 68, 68, 0.025)';

      offset = (offset + 0.05) % gridSize; // Extremely slow grid drift

      ctx.beginPath();
      // Vertical Grid Lines
      for (let x = -gridSize; x < width + gridSize; x += gridSize) {
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, height);
      }
      // Horizontal Grid Lines
      for (let y = -gridSize; y < height + gridSize; y += gridSize) {
        ctx.moveTo(0, y + offset);
        ctx.lineTo(width, y + offset);
      }
      ctx.stroke();

      // Render gentle slow-drifting stars
      for (let p of particles) {
        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isLightMode 
          ? `rgba(0, 0, 0, ${p.opacity * 0.4})` 
          : `rgba(239, 68, 68, ${p.opacity})`;
        ctx.fill();
      }

      // Draw 2 very subtle static ambient radial glows on left/right for dark mode only to avoid muddying light mode
      if (!isLightMode) {
        const isDesktop = width >= 1024;
        const cx = isDesktop ? (width + 256) / 2 : width / 2;
        const cy = height / 2;

        ctx.beginPath();
        const pulseSize = 120 + Math.sin(Date.now() * 0.0005) * 10;
        const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseSize * 3);
        coreGrad.addColorStop(0, 'rgba(239, 68, 68, 0.015)'); // Barely visible crimson glow
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.arc(cx, cy, pulseSize * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}

