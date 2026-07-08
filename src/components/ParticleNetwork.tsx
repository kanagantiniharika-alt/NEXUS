import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to cover parent element
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth / 2);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    type Particle = { x: number; y: number; vx: number; vy: number; size: number };
    const particles: Particle[] = [];
    // Adjust density for container size
    const particleCount = 200; 
    const connectionDistance = 140;
    let mouse = { x: -1000, y: -1000 };

    const initialRadius = Math.min(width, height) * 0.48;
    const initialCx = width / 2;
    const initialCy = height / 2;

    for (let i = 0; i < particleCount; i++) {
      let angle = Math.random() * Math.PI * 2;
      let r = Math.random() * initialRadius;
      particles.push({
        x: initialCx + Math.cos(angle) * r,
        y: initialCy + Math.sin(angle) * r,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 1.5, // Slightly larger dots
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Enforce ONLY white lines/dots as requested
      const dotColor = 'rgba(255, 255, 255, 0.6)';
      const lineColorFn = (opacity: number) => `rgba(255, 255, 255, ${opacity * 0.5})`;

      const currentRadius = Math.min(width, height) * 0.48;
      const currentCx = width / 2;
      const currentCy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        // Circular bounds
        const dx = p.x - currentCx;
        const dy = p.y - currentCy;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);

        if (distToCenter + p.size > currentRadius) {
           // Normal vector at intersection
           const nx = dx / distToCenter;
           const ny = dy / distToCenter;
           
           // Reflect velocity vector
           const dotProduct = p.vx * nx + p.vy * ny;
           p.vx = p.vx - 2 * dotProduct * nx;
           p.vy = p.vy - 2 * dotProduct * ny;
           
           // Nudge particle back inside
           p.x = currentCx + nx * (currentRadius - p.size);
           p.y = currentCy + ny * (currentRadius - p.size);
        }

        // Mouse repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 150) {
          const force = (150 - mDist) / 150;
          p.x += (mdx / mDist) * force * 3;
          p.y += (mdy / mDist) * force * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            // Thicker lines for more prominence
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = lineColorFn(1 - dist / connectionDistance);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 z-0 pointer-events-auto hidden lg:block">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}
