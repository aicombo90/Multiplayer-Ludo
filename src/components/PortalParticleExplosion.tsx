import React, { useEffect, useRef } from 'react';

interface PortalParticleExplosionProps {
  active: boolean;
  isGrandVictory?: boolean;
  realmColor?: string;
  onComplete?: () => void;
}

export const PortalParticleExplosion: React.FC<PortalParticleExplosionProps> = ({
  active,
  isGrandVictory = true,
  realmColor = "#FFD700",
  onComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const particles = [];
    const particleCount = isGrandVictory ? 250 : 80;
    const colors = [
      realmColor,
      "#FFD700",
      // Gold
      "#FFFFFF",
      // Pure White
      "#00FF41",
      // Mythic Green
      "#FF0055",
      // Vivid Crimson
      "#00E5FF"
      // Cyan Spark
    ];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = isGrandVictory ? Math.random() * 22 + 6 : Math.random() * 12 + 4;
      const shapes = ["circle", "star", "diamond", "square"];
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isGrandVictory ? 12 : 8) + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 8e-3,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      });
    }
    let shockwaveRadius = 10;
    let shockwaveAlpha = 1;
    let animId;
    const drawStar = (c, cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;
      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      if (shockwaveAlpha > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = realmColor;
        ctx.lineWidth = isGrandVictory ? 8 : 4;
        ctx.globalAlpha = shockwaveAlpha;
        ctx.shadowBlur = 20;
        ctx.shadowColor = realmColor;
        ctx.stroke();
        ctx.restore();
        shockwaveRadius += isGrandVictory ? 18 : 10;
        shockwaveAlpha -= 0.025;
      }
      let activeParticles = 0;
      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        activeParticles++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= p.decay;
        p.rotation += p.vRot;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 1.5;
        ctx.shadowColor = p.color;
        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "star") {
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
        } else if (p.shape === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size / 1.5, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size / 1.5, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });
      if (activeParticles > 0 || shockwaveAlpha > 0) {
        animId = requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };
    render();
    const autoFinishTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, isGrandVictory ? 3500 : 1800);
    return () => {
      clearTimeout(autoFinishTimer);
      cancelAnimationFrame(animId);
    };
  }, [active, isGrandVictory, realmColor, onComplete]);
  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none w-full h-full"
    />
  );
};

