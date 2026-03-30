"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MIN_ZOOM, MAX_ZOOM, GRID_SIZE } from "@repo/types";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface UseViewportOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tileSize?: number;
}

interface UseViewportReturn {
  viewport: Viewport;
  setViewport: React.Dispatch<React.SetStateAction<Viewport>>;
  handleWheel: (e: React.WheelEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  isPanning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  navigateTo: (x: number, y: number) => void;
  containerSize: { width: number; height: number };
}

export function useViewport({
  containerRef,
  tileSize = 20,
}: UseViewportOptions): UseViewportReturn {
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDistance = useRef<number | null>(null);

  // Track container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Clamp viewport position to valid bounds
  const clampViewport = useCallback(
    (v: Viewport): Viewport => {
      const gridPixelSize = GRID_SIZE * tileSize * v.zoom;
      const maxX = Math.max(
        0,
        GRID_SIZE - containerSize.width / (tileSize * v.zoom),
      );
      const maxY = Math.max(
        0,
        GRID_SIZE - containerSize.height / (tileSize * v.zoom),
      );

      return {
        x: Math.max(0, Math.min(v.x, maxX)),
        y: Math.max(0, Math.min(v.y, maxY)),
        zoom: Math.max(MIN_ZOOM, Math.min(v.zoom, MAX_ZOOM)),
      };
    },
    [containerSize, tileSize],
  );

  // Wheel zoom handler
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewport((prev) => {
        const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(
          MIN_ZOOM,
          Math.min(prev.zoom * zoomDelta, MAX_ZOOM),
        );

        // Zoom toward mouse position
        const scaleFactor = newZoom / prev.zoom;
        const newX =
          prev.x + (mouseX / (tileSize * prev.zoom)) * (1 - 1 / scaleFactor);
        const newY =
          prev.y + (mouseY / (tileSize * prev.zoom)) * (1 - 1 / scaleFactor);

        return clampViewport({ x: newX, y: newY, zoom: newZoom });
      });
    },
    [containerRef, clampViewport, tileSize],
  );

  // Mouse pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+click to pan
      e.preventDefault();
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !lastPanPoint.current) return;

      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;

      setViewport((prev) =>
        clampViewport({
          x: prev.x - deltaX / (tileSize * prev.zoom),
          y: prev.y - deltaY / (tileSize * prev.zoom),
          zoom: prev.zoom,
        }),
      );

      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning, clampViewport, tileSize],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    lastPanPoint.current = null;
  }, []);

  // Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const touch0 = touches[0];
    const touch1 = touches[1];
    if (!touch0 || !touch1) return 0;
    const dx = touch0.clientX - touch1.clientX;
    const dy = touch0.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch0 = e.touches[0];
    if (e.touches.length === 1 && touch0) {
      setIsPanning(true);
      lastPanPoint.current = {
        x: touch0.clientX,
        y: touch0.clientY,
      };
    } else if (e.touches.length === 2) {
      lastTouchDistance.current = getTouchDistance(e.touches);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch0 = e.touches[0];
      if (e.touches.length === 1 && isPanning && lastPanPoint.current && touch0) {
        const deltaX = touch0.clientX - lastPanPoint.current.x;
        const deltaY = touch0.clientY - lastPanPoint.current.y;

        setViewport((prev) =>
          clampViewport({
            x: prev.x - deltaX / (tileSize * prev.zoom),
            y: prev.y - deltaY / (tileSize * prev.zoom),
            zoom: prev.zoom,
          }),
        );

        lastPanPoint.current = {
          x: touch0.clientX,
          y: touch0.clientY,
        };
      } else if (e.touches.length === 2 && lastTouchDistance.current) {
        // Pinch zoom
        const newDistance = getTouchDistance(e.touches);
        const scaleFactor = newDistance / lastTouchDistance.current;

        setViewport((prev) =>
          clampViewport({
            ...prev,
            zoom: prev.zoom * scaleFactor,
          }),
        );

        lastTouchDistance.current = newDistance;
      }
    },
    [isPanning, clampViewport, tileSize],
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    lastPanPoint.current = null;
    lastTouchDistance.current = null;
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setViewport((prev) => clampViewport({ ...prev, zoom: prev.zoom * 1.25 }));
  }, [clampViewport]);

  const zoomOut = useCallback(() => {
    setViewport((prev) => clampViewport({ ...prev, zoom: prev.zoom * 0.8 }));
  }, [clampViewport]);

  const resetView = useCallback(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, []);

  const navigateTo = useCallback(
    (x: number, y: number) => {
      const visibleTilesX = containerSize.width / (tileSize * viewport.zoom);
      const visibleTilesY = containerSize.height / (tileSize * viewport.zoom);

      setViewport((prev) =>
        clampViewport({
          x: Math.max(0, x - visibleTilesX / 2),
          y: Math.max(0, y - visibleTilesY / 2),
          zoom: prev.zoom,
        }),
      );
    },
    [containerSize, viewport.zoom, clampViewport, tileSize],
  );

  return {
    viewport,
    setViewport,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning,
    zoomIn,
    zoomOut,
    resetView,
    navigateTo,
    containerSize,
  };
}
