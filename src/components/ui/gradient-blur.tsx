"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GradientBlurProps {
  radius?: number;
  opacityDecay?: number;
  backgroundColor?: string;
  color?: [number, number, number];
  colorGenerator?: () => [number, number, number];
  /**
   * Minimum ms between newly spawned circles. Caps how fast new ones can
   * stack up during fast movement. 0 = spawn every frame (matches the
   * original component's behavior).
   */
  spawnIntervalMs?: number;
  /**
   * Minimum cursor movement (px) since the last spawned circle before a
   * new one is spawned. This is what actually prevents a stationary
   * cursor from additively saturating to a bright hotspot — with this
   * set, an idle cursor spawns nothing and existing circles simply decay
   * away. 0 = spawn regardless of movement (matches the original
   * component's behavior).
   */
  minMoveDistance?: number;
  className?: string;
}

export function GradientBlur({
  radius = 60,
  opacityDecay = 0.025,
  backgroundColor = "transparent",
  color,
  colorGenerator,
  spawnIntervalMs = 0,
  minMoveDistance = 0,
  className,
}: GradientBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastSpawnRef = useRef(0);
  const lastSpawnPosRef = useRef<{ x: number; y: number } | null>(null);
  const circsRef = useRef<
    Array<{
      col: [number, number, number];
      x: number;
      y: number;
      grdblur: CanvasGradient;
      alpha: number;
    }>
  >([]);

  const defaultColorGenerator = (): [number, number, number] => [
    Math.floor(Math.random() * 130 + 10),
    Math.floor(0.5 * Math.random() * 50),
    Math.floor(0.5 * Math.random() * 255),
  ];

  const getColor = () => color || colorGenerator?.() || defaultColorGenerator();

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const rafRef = { current: 0 };

    const draw = () => {
      ctx.globalCompositeOperation = "source-over";
      if (backgroundColor === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalCompositeOperation = "lighter";

      const now = performance.now();
      const lastPos = lastSpawnPosRef.current;
      const movedFar =
        minMoveDistance <= 0 ||
        !lastPos ||
        Math.hypot(mouseRef.current.x - lastPos.x, mouseRef.current.y - lastPos.y) >=
          minMoveDistance;
      const enoughTimePassed =
        spawnIntervalMs <= 0 || now - lastSpawnRef.current >= spawnIntervalMs;

      if (movedFar && enoughTimePassed) {
        lastSpawnRef.current = now;
        lastSpawnPosRef.current = { x: mouseRef.current.x, y: mouseRef.current.y };
        circsRef.current.push({
          col: getColor(),
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          grdblur: ctx.createRadialGradient(
            mouseRef.current.x,
            mouseRef.current.y,
            0,
            mouseRef.current.x,
            mouseRef.current.y,
            radius,
          ),
          alpha: 1,
        });
      }

      const toRemove: number[] = [];
      for (let i = 0; i < circsRef.current.length; i++) {
        const circ = circsRef.current[i]!;

        circ.grdblur.addColorStop(0, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.95)`);
        circ.grdblur.addColorStop(0.2, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.7)`);
        circ.grdblur.addColorStop(0.5, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0.3)`);
        circ.grdblur.addColorStop(1, `rgba(${circ.col[0]},${circ.col[1]},${circ.col[2]},0)`);

        ctx.beginPath();
        ctx.fillStyle = circ.grdblur;
        ctx.globalAlpha = circ.alpha;
        ctx.arc(circ.x, circ.y, radius, 0, Math.PI * 2);
        ctx.fill();

        circ.alpha -= opacityDecay;
        if (circ.alpha <= 0) toRemove.push(i);
      }

      for (let i = toRemove.length - 1; i >= 0; i--) {
        circsRef.current.splice(toRemove[i]!, 1);
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    const updateMouseFromClient = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = clientX - rect.left;
      mouseRef.current.y = clientY - rect.top;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updateMouseFromClient(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      updateMouseFromClient(touch.clientX, touch.clientY);
    };

    // Listened on window (not the canvas itself) so movement over sibling
    // content stacked above this decorative layer still updates the glow.
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [
    radius,
    opacityDecay,
    backgroundColor,
    color,
    colorGenerator,
    spawnIntervalMs,
    minMoveDistance,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-screen w-full cursor-move overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0" style={{ background: "transparent" }} />
    </div>
  );
}
