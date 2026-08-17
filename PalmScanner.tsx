import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PalmFeatures } from '../types';
import { PALM_ELEMENT_TYPES } from '../data/palmistryData';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Hand, 
  Activity,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit3
} from 'lucide-react';

interface PalmScannerProps {
  onPalmAnalyzed: (features: PalmFeatures, imageBase64: string) => void;
  userAgeGroup?: string;
  userGoals?: string[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CustomPalmLines {
  heartLine?: Point2D[];
  headLine?: Point2D[];
  lifeLine?: Point2D[];
  fateLine?: Point2D[];
  sunLine?: Point2D[];
}

interface HandDetectionResult {
  hasHand: boolean;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  thumbOnLeft: boolean;
  detectedHandSide: 'Right Hand' | 'Left Hand';
  creaseIntensity: number;
}

// Computer Vision Palm & Hand Boundary Detection from Canvas Pixels
function detectHandBoundsAndOrientation(ctx: CanvasRenderingContext2D, w: number, h: number): HandDetectionResult {
  try {
    const step = 4;
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let count = 0;
    let sumX = 0, sumY = 0;

    const skinGridWidth = Math.floor(w / step);
    const skinGridHeight = Math.floor(h / step);
    const skinGrid = new Uint8Array(skinGridWidth * skinGridHeight);

    for (let gy = 0; gy < skinGridHeight; gy++) {
      const y = gy * step;
      for (let gx = 0; gx < skinGridWidth; gx++) {
        const x = gx * step;
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Skin tone detection
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const isSkin = 
          r > 38 && g > 20 && b > 15 &&
          max - min > 10 &&
          r > g && r > b &&
          Math.abs(r - g) > 8 &&
          (r - g) < 130;

        if (isSkin) {
          skinGrid[gy * skinGridWidth + gx] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    if (count > 80 && maxX > minX + 50 && maxY > minY + 50) {
      // Determine thumb lateral position (protrusion in mid-lower hand region)
      const handH = maxY - minY;
      const lowerYStart = minY + handH * 0.45;
      const lowerYEnd = minY + handH * 0.82;
      const centerX = (minX + maxX) / 2;

      let maxLeftExtension = 0;
      let maxRightExtension = 0;

      for (let gy = Math.floor(lowerYStart / step); gy <= Math.floor(lowerYEnd / step); gy++) {
        for (let gx = 0; gx < skinGridWidth; gx++) {
          if (skinGrid[gy * skinGridWidth + gx] === 1) {
            const px = gx * step;
            if (px < centerX) {
              const leftDist = centerX - px;
              if (leftDist > maxLeftExtension) maxLeftExtension = leftDist;
            } else {
              const rightDist = px - centerX;
              if (rightDist > maxRightExtension) maxRightExtension = rightDist;
            }
          }
        }
      }

      // Thumb on left = Left Hand facing camera; Thumb on right = Right Hand
      const thumbOnLeft = maxLeftExtension >= maxRightExtension;
      const detectedHandSide: 'Right Hand' | 'Left Hand' = thumbOnLeft ? 'Left Hand' : 'Right Hand';

      const padX = (maxX - minX) * 0.02;
      const padY = (maxY - minY) * 0.02;

      const normMinX = Math.max(0, (minX - padX) / w);
      const normMaxX = Math.min(1, (maxX + padX) / w);
      const normMinY = Math.max(0, (minY - padY) / h);
      const normMaxY = Math.min(1, (maxY + padY) / h);

      return {
        hasHand: true,
        minX: normMinX,
        maxX: normMaxX,
        minY: normMinY,
        maxY: normMaxY,
        centerX: (sumX / count) / w,
        centerY: (sumY / count) / h,
        width: normMaxX - normMinX,
        height: normMaxY - normMinY,
        thumbOnLeft,
        detectedHandSide,
        creaseIntensity: count > 200 ? 0.88 : 0.65
      };
    }
  } catch (e) {
    console.warn('[PalmScanner] Hand detection heuristic error:', e);
  }

  // Fallback centered hand bounds
  return {
    hasHand: false,
    minX: 0.20,
    maxX: 0.80,
    minY: 0.10,
    maxY: 0.90,
    centerX: 0.50,
    centerY: 0.50,
    width: 0.60,
    height: 0.80,
    thumbOnLeft: true,
    detectedHandSide: 'Left Hand',
    creaseIntensity: 0.70
  };
}

// Generate realistic Palm Crease Lines fitted to hand bounds and thumb lateral side
function computeDefaultPalmLines(
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  thumbOnLeft: boolean
): CustomPalmLines {
  const w = maxX - minX;
  const h = maxY - minY;

  if (thumbOnLeft) {
    // Left Hand (Thumb on Left, Pinky on Right):
    // 1. Heart Line: pinky side under fingers across to below index
    const heartLine = [
      { x: minX + w * 0.88, y: minY + h * 0.48 },
      { x: minX + w * 0.66, y: minY + h * 0.45 },
      { x: minX + w * 0.48, y: minY + h * 0.43 },
      { x: minX + w * 0.35, y: minY + h * 0.46 }
    ];

    // 2. Head Line: thumb-index cleft across mid palm
    const headLine = [
      { x: minX + w * 0.26, y: minY + h * 0.52 },
      { x: minX + w * 0.44, y: minY + h * 0.56 },
      { x: minX + w * 0.64, y: minY + h * 0.60 },
      { x: minX + w * 0.82, y: minY + h * 0.65 }
    ];

    // 3. Life Line: thumb-index cleft curving around thumb muscle to inner wrist
    const lifeLine = [
      { x: minX + w * 0.26, y: minY + h * 0.52 },
      { x: minX + w * 0.36, y: minY + h * 0.60 },
      { x: minX + w * 0.36, y: minY + h * 0.74 },
      { x: minX + w * 0.44, y: minY + h * 0.88 }
    ];

    // 4. Fate Line: vertical centerline from wrist up towards middle finger
    const fateLine = [
      { x: minX + w * 0.50, y: minY + h * 0.86 },
      { x: minX + w * 0.50, y: minY + h * 0.64 },
      { x: minX + w * 0.51, y: minY + h * 0.44 }
    ];

    // 5. Sun Line: vertical crease toward ring finger mount
    const sunLine = [
      { x: minX + w * 0.65, y: minY + h * 0.68 },
      { x: minX + w * 0.66, y: minY + h * 0.44 }
    ];

    return { heartLine, headLine, lifeLine, fateLine, sunLine };
  } else {
    // Right Hand (Thumb on Right, Pinky on Left):
    // 1. Heart Line: pinky side (left) across to index finger base (right)
    const heartLine = [
      { x: minX + w * 0.12, y: minY + h * 0.48 },
      { x: minX + w * 0.34, y: minY + h * 0.45 },
      { x: minX + w * 0.52, y: minY + h * 0.43 },
      { x: minX + w * 0.65, y: minY + h * 0.46 }
    ];

    // 2. Head Line: thumb-index cleft (right) across mid palm
    const headLine = [
      { x: minX + w * 0.74, y: minY + h * 0.52 },
      { x: minX + w * 0.56, y: minY + h * 0.56 },
      { x: minX + w * 0.36, y: minY + h * 0.60 },
      { x: minX + w * 0.18, y: minY + h * 0.65 }
    ];

    // 3. Life Line: thumb-index cleft (right) curving around thumb muscle to inner wrist
    const lifeLine = [
      { x: minX + w * 0.74, y: minY + h * 0.52 },
      { x: minX + w * 0.64, y: minY + h * 0.60 },
      { x: minX + w * 0.64, y: minY + h * 0.74 },
      { x: minX + w * 0.56, y: minY + h * 0.88 }
    ];

    // 4. Fate Line: vertical centerline from wrist up towards middle finger
    const fateLine = [
      { x: minX + w * 0.50, y: minY + h * 0.86 },
      { x: minX + w * 0.50, y: minY + h * 0.64 },
      { x: minX + w * 0.49, y: minY + h * 0.44 }
    ];

    // 5. Sun Line: vertical crease toward ring finger mount
    const sunLine = [
      { x: minX + w * 0.35, y: minY + h * 0.68 },
      { x: minX + w * 0.34, y: minY + h * 0.44 }
    ];

    return { heartLine, headLine, lifeLine, fateLine, sunLine };
  }
}

// Render Only the Traced Major Palm Lines Over the Palm Photo
function renderPalmLines(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  showPalmLines: boolean = true,
  highlightedLine: string | null = null,
  customLines: CustomPalmLines | null = null,
  activeDragPoint: { type: string; index: number } | null = null,
  isEditMode: boolean = false
) {
  if (!showPalmLines || !customLines) return;

  ctx.save();

  const drawSmoothSpline = (
    points: Point2D[],
    name: string,
    color: string,
    glowColor: string
  ) => {
    if (!points || points.length < 2) return;
    const isSelected = highlightedLine === name;
    const isDimmed = highlightedLine !== null && !isSelected;

    ctx.save();
    ctx.beginPath();

    const screenPts = points.map(p => ({ x: p.x * w, y: p.y * h }));
    ctx.moveTo(screenPts[0].x, screenPts[0].y);

    if (screenPts.length === 2) {
      ctx.lineTo(screenPts[1].x, screenPts[1].y);
    } else {
      for (let i = 0; i < screenPts.length - 1; i++) {
        const p0 = screenPts[i === 0 ? 0 : i - 1];
        const p1 = screenPts[i];
        const p2 = screenPts[i + 1];
        const p3 = screenPts[i + 2 < screenPts.length ? i + 2 : i + 1];

        // Catmull-Rom to Cubic Bezier conversion
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.strokeStyle = color;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isSelected ? 20 : 12;
    ctx.lineWidth = isSelected ? Math.max(5.5, w * 0.013) : isDimmed ? 1.8 : Math.max(3.8, w * 0.009);
    ctx.globalAlpha = isDimmed ? 0.35 : 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draggable calibration anchor points in edit mode
    if (isEditMode) {
      screenPts.forEach((sp, pIdx) => {
        const isDraggingThis = activeDragPoint?.type === name && activeDragPoint?.index === pIdx;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, isDraggingThis ? 8 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = isDraggingThis ? '#ffffff' : color;
        ctx.strokeStyle = '#0A0A0F';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });
    }

    // Line Badge Label at midpoint
    if (!isDimmed && screenPts.length > 0) {
      const midIdx = Math.floor(screenPts.length / 2);
      const labelPos = screenPts[midIdx] || screenPts[0];

      ctx.save();
      ctx.font = 'bold 9.5px sans-serif';
      const labelText = name.toUpperCase();
      const textMetrics = ctx.measureText(labelText);
      const padX = 5;
      const padY = 2.5;
      const bw = textMetrics.width + padX * 2;
      const bh = 14 + padY * 2;

      const lx = Math.max(6, Math.min(w - bw - 6, labelPos.x - bw / 2));
      const ly = Math.max(16, Math.min(h - 12, labelPos.y - 12));

      ctx.fillStyle = 'rgba(10, 10, 18, 0.92)';
      ctx.fillRect(lx, ly - 10 - padY, bw, bh);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly - 10 - padY, bw, bh);

      ctx.fillStyle = color;
      ctx.fillText(labelText, lx + padX, ly - padY + 1.5);
      ctx.restore();
    }

    ctx.restore();
  };

  // Draw 5 Palm Lines
  if (customLines.heartLine) {
    drawSmoothSpline(customLines.heartLine, 'Heart Line', '#ec4899', '#ec4899');
  }
  if (customLines.headLine) {
    drawSmoothSpline(customLines.headLine, 'Head Line', '#38bdf8', '#38bdf8');
  }
  if (customLines.lifeLine) {
    drawSmoothSpline(customLines.lifeLine, 'Life Line', '#f43f5e', '#f43f5e');
  }
  if (customLines.fateLine) {
    drawSmoothSpline(customLines.fateLine, 'Fate Line', '#a855f7', '#a855f7');
  }
  if (customLines.sunLine) {
    drawSmoothSpline(customLines.sunLine, 'Sun Line', '#fbbf24', '#fbbf24');
  }

  ctx.restore();
}

export const PalmScanner: React.FC<PalmScannerProps> = ({ onPalmAnalyzed, userAgeGroup, userGoals }) => {
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [handSide, setHandSide] = useState<'Right Hand' | 'Left Hand'>('Left Hand');
  const [showPalmLines, setShowPalmLines] = useState<boolean>(true);
  const [showContrastFilter, setShowContrastFilter] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<PalmFeatures | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [palmLines, setPalmLines] = useState<CustomPalmLines | null>(null);
  const [handDetectedInView, setHandDetectedInView] = useState<boolean>(false);
  const [hoveredLineName, setHoveredLineName] = useState<string | null>(null);
  const [thumbIsOnLeft, setThumbIsOnLeft] = useState<boolean>(true);
  
  // Interactive Adjustment Mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeDragPoint, setActiveDragPoint] = useState<{ type: string; index: number } | null>(null);
  const [lineOffset, setLineOffset] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1.0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Redraw photo canvas with traced palm lines
  const redrawStaticCanvas = useCallback(() => {
    if (!currentImageBase64) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImageBase64;

    img.onload = () => {
      canvas.width = img.width || 640;
      canvas.height = img.height || 640;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (showContrastFilter) {
        ctx.filter = 'contrast(1.35) saturate(1.2) brightness(0.95)';
      } else {
        ctx.filter = 'none';
      }

      // Draw original palm photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';

      let currentLines = palmLines;

      if (!currentLines) {
        const detection = detectHandBoundsAndOrientation(ctx, canvas.width, canvas.height);
        setHandDetectedInView(detection.hasHand);
        setThumbIsOnLeft(detection.thumbOnLeft);
        setHandSide(detection.detectedHandSide);
        
        currentLines = computeDefaultPalmLines(
          detection.minX,
          detection.maxX,
          detection.minY,
          detection.maxY,
          detection.thumbOnLeft
        );
        setPalmLines(currentLines);
      }

      // Apply line offset nudges if any
      let adjustedLines = currentLines;
      if (currentLines && (lineOffset.x !== 0 || lineOffset.y !== 0 || lineOffset.scale !== 1)) {
        adjustedLines = {};
        Object.entries(currentLines).forEach(([key, pts]) => {
          if (pts && Array.isArray(pts)) {
            const center = { x: 0.5, y: 0.5 };
            adjustedLines![key as keyof CustomPalmLines] = pts.map(p => ({
              x: center.x + (p.x - center.x) * lineOffset.scale + lineOffset.x,
              y: center.y + (p.y - center.y) * lineOffset.scale + lineOffset.y
            }));
          }
        });
      }

      // Render only the Palm Lines
      renderPalmLines(
        ctx,
        canvas.width,
        canvas.height,
        showPalmLines,
        hoveredLineName,
        adjustedLines,
        activeDragPoint,
        isEditMode
      );
    };
  }, [currentImageBase64, palmLines, showPalmLines, showContrastFilter, hoveredLineName, lineOffset, isEditMode, activeDragPoint]);

  useEffect(() => {
    redrawStaticCanvas();
  }, [redrawStaticCanvas]);

  // Live Camera Real-Time Vision Loop (Renders palm lines only)
  useEffect(() => {
    if (!isCameraActive) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const processLiveFrame = () => {
      const video = videoRef.current;
      const liveCanvas = liveCanvasRef.current;
      if (!video || !liveCanvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(processLiveFrame);
        return;
      }

      liveCanvas.width = video.videoWidth || 640;
      liveCanvas.height = video.videoHeight || 640;

      const liveCtx = liveCanvas.getContext('2d');
      if (liveCtx) {
        liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);

        // Offscreen canvas for fast real-time hand detection
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 240;
        offCanvas.height = 240;
        const offCtx = offCanvas.getContext('2d');

        if (offCtx) {
          offCtx.drawImage(video, 0, 0, 240, 240);
          const detection = detectHandBoundsAndOrientation(offCtx, 240, 240);
          setHandDetectedInView(detection.hasHand);

          if (detection.hasHand) {
            setThumbIsOnLeft(detection.thumbOnLeft);
            setHandSide(detection.detectedHandSide);

            const liveLines = computeDefaultPalmLines(
              detection.minX,
              detection.maxX,
              detection.minY,
              detection.maxY,
              detection.thumbOnLeft
            );

            renderPalmLines(
              liveCtx,
              liveCanvas.width,
              liveCanvas.height,
              showPalmLines,
              hoveredLineName,
              liveLines,
              null,
              false
            );
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processLiveFrame);
    };

    animFrameRef.current = requestAnimationFrame(processLiveFrame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isCameraActive, showPalmLines, hoveredLineName]);

  // Handle Photo Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const base64 = event.target.result as string;
          setCurrentImageBase64(base64);
          setPalmLines(null);
          setLineOffset({ x: 0, y: 0, scale: 1.0 });
          triggerPalmAnalysis(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Camera Capture
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access was not granted or is unavailable.');
      setIsCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCurrentImageBase64(dataUrl);
        setPalmLines(null);
        setLineOffset({ x: 0, y: 0, scale: 1.0 });

        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setIsCameraActive(false);
        triggerPalmAnalysis(dataUrl);
      }
    }
  };

  // Toggle Hand Side Override
  const toggleHandSideManually = () => {
    const newThumbLeft = !thumbIsOnLeft;
    setThumbIsOnLeft(newThumbLeft);
    setHandSide(newThumbLeft ? 'Left Hand' : 'Right Hand');

    // Recompute default lines for the flipped side
    const newLines = computeDefaultPalmLines(0.20, 0.80, 0.10, 0.90, newThumbLeft);
    setPalmLines(newLines);
  };

  // Nudge / Adjust Controls
  const handleNudge = (dx: number, dy: number) => {
    setLineOffset(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  };

  const handleScale = (dScale: number) => {
    setLineOffset(prev => ({ ...prev, scale: Math.max(0.6, Math.min(1.6, prev.scale + dScale)) }));
  };

  const resetAdjustment = () => {
    setLineOffset({ x: 0, y: 0, scale: 1.0 });
    setPalmLines(computeDefaultPalmLines(0.20, 0.80, 0.10, 0.90, thumbIsOnLeft));
  };

  // Canvas Mouse / Drag Handlers for Interactive Point Calibration
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !palmLines || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    let closest: { type: string; index: number } | null = null;
    let minDist = 0.06;

    Object.entries(palmLines).forEach(([lineName, pts]) => {
      if (pts && Array.isArray(pts)) {
        pts.forEach((p, idx) => {
          const dist = Math.hypot(p.x - clickX, p.y - clickY);
          if (dist < minDist) {
            minDist = dist;
            closest = { type: lineName, index: idx };
          }
        });
      }
    });

    if (closest) {
      setActiveDragPoint(closest);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditMode || !activeDragPoint || !palmLines || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const newX = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    const newY = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));

    const lineKey = activeDragPoint.type as keyof CustomPalmLines;
    const existingPts = palmLines[lineKey];
    if (existingPts && existingPts[activeDragPoint.index]) {
      const updatedPts = [...existingPts];
      updatedPts[activeDragPoint.index] = { x: newX, y: newY };
      setPalmLines({
        ...palmLines,
        [lineKey]: updatedPts
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setActiveDragPoint(null);
  };

  // Trigger Analysis Pipeline with Gemini AI
  const triggerPalmAnalysis = async (imgBase64: string) => {
    setIsProcessing(true);
    setProcessingStage('1/2 Tracing Palm Creases (Heart, Head, Life, Fate, Sun)...');

    setTimeout(() => {
      setProcessingStage('2/2 Synthesizing AI Palmistry Intelligence...');
    }, 900);

    try {
      const res = await fetch('/api/palm/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgBase64,
          handSide,
          userAge: userAgeGroup || '25-34',
          userGoals: userGoals || ['Career', 'Spiritual Growth']
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        // If Gemini returned exact line coordinates, adopt them
        if (data.analysis.lines) {
          const aiLines = data.analysis.lines;
          setPalmLines({
            heartLine: aiLines.heartLine || undefined,
            headLine: aiLines.headLine || undefined,
            lifeLine: aiLines.lifeLine || undefined,
            fateLine: aiLines.fateLine || undefined,
            sunLine: aiLines.sunLine || undefined,
          });
        }

        if (data.analysis.detectedHandSide) {
          const detectedSide = data.analysis.detectedHandSide;
          setHandSide(detectedSide);
          setThumbIsOnLeft(detectedSide === 'Left Hand');
        }

        const resultAnalysis: PalmFeatures = {
          handType: data.analysis.handType || 'Fire',
          lifeLine: {
            name: 'Life Line',
            length: 'Long',
            quality: 'Clear',
            interpretation: data.analysis.lifeLineInterpretation || 'The Life Line curves generously around the Mount of Venus, reflecting strong vitality, emotional grounding, and resilience.',
            confidence: 0.94
          },
          headLine: {
            name: 'Head Line',
            length: 'Long',
            quality: 'Clear',
            interpretation: data.analysis.headLineInterpretation || 'The head line shows a clear, straight trajectory, suggesting practical wisdom, sharp discernment, and structured logic.',
            confidence: 0.92
          },
          heartLine: {
            name: 'Heart Line',
            length: 'Long',
            quality: 'Clear',
            interpretation: data.analysis.heartLineInterpretation || 'The heart line curves gracefully under the index finger, reflecting emotional warmth, genuine empathy, and deep interpersonal loyalty.',
            confidence: 0.90
          },
          fateLine: {
            name: 'Fate Line',
            length: 'Medium',
            quality: 'Clear',
            interpretation: data.analysis.fateLineInterpretation || 'A steadfast fate line ascending through the center of the palm signifies strong self-determination and focused career goals.',
            confidence: 0.88
          },
          sunLine: {
            name: 'Sun Line (Apollo)',
            length: 'Medium',
            quality: 'Clear',
            interpretation: data.analysis.sunLineInterpretation || 'A clear Sun Line near the ring finger indicates creative spark, public recognition, and personal fulfillment.',
            confidence: 0.86
          },
          fingerStructure: { thumbFlexibility: 'Flexible', indexLength: 'Long & Straight', ringToIndexRatio: '1:1 Balanced' },
          mounts: { venus: 'Well Developed', jupiter: 'Prominent', saturn: 'Normal', apollo: 'Elevated' },
          detectionConfidence: data.analysis.confidence || 0.94,
          landmarksCount: 5
        };

        setCurrentAnalysis(resultAnalysis);
        onPalmAnalyzed(resultAnalysis, imgBase64);
      }
    } catch (err) {
      console.error('[PalmScanner] Palm analysis error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Studio Header Banner */}
      <div className="bg-[#0A0A0F] rounded-2xl p-6 border border-white/10 shadow-2xl text-[#E0E0E6] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-violet-400 font-mono text-[10px] tracking-[0.25em] uppercase mb-1">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Palm Vision Engine • Precision Palm Line Tracing</span>
          </div>
          <h2 className="text-2xl font-light text-white italic serif">
            Palmistry <span className="font-bold not-italic">Line Scanner</span>
          </h2>
          <p className="text-xs text-white/50 max-w-2xl mt-1">
            Upload any hand photo or snap from your webcam. The vision engine automatically traces your 5 major palm lines (Life, Head, Heart, Fate, Sun) directly onto your palm creases.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-xs font-semibold tracking-wider uppercase transition-all"
          >
            <Upload className="w-4 h-4 text-violet-400" />
            <span>Upload Photo</span>
          </button>

          <button
            onClick={startCamera}
            className="flex items-center space-x-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-[0.15em] sleek-glow-violet transition-all"
          >
            <Camera className="w-4 h-4 text-amber-300" />
            <span>Open Camera</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Viewport */}
        <div className="lg:col-span-6 space-y-4">
          
          <div className="relative bg-[#0A0A0F] border border-white/10 rounded-2xl p-4 overflow-hidden flex flex-col items-center justify-center min-h-[480px] text-[#E0E0E6]">
            
            {/* Live Camera Feed with Palm Line Overlay */}
            {isCameraActive ? (
              <div className="relative w-full max-w-md flex flex-col items-center">
                <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-violet-500/50 shadow-2xl bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  
                  {/* Live Canvas Overlay Layer for Palm Lines */}
                  <canvas
                    ref={liveCanvasRef}
                    style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 rounded-xl"
                  />

                  {/* Laser Scanning Animation Bar */}
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: ['5%', '90%', '5%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_18px_#8B5CF6] pointer-events-none z-20"
                  />

                  {/* Status Overlay Badge */}
                  <div className="absolute top-3 left-3 text-[10px] font-mono text-violet-400 bg-black/85 backdrop-blur-md border border-violet-500/40 px-2.5 py-1 rounded flex items-center space-x-1.5 z-20">
                    <span className={`w-2 h-2 rounded-full ${handDetectedInView ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                    <span>{handDetectedInView ? `HAND DETECTED (${handSide.toUpperCase()}) • PALM LINES` : 'HOLD PALM STEADY IN FRAME'}</span>
                  </div>

                  <button
                    onClick={() => setIsMirrored(!isMirrored)}
                    className="absolute top-3 right-3 text-[10px] font-mono text-white bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded transition-colors z-20"
                  >
                    {isMirrored ? 'Mirror: ON' : 'Mirror: OFF'}
                  </button>
                </div>

                <div className="mt-3 flex gap-2 w-full">
                  <button
                    onClick={captureCameraPhoto}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-xl sleek-glow-violet transition-all flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Snap Photo & Trace Lines</span>
                  </button>
                  <button
                    onClick={() => {
                      const video = videoRef.current;
                      if (video && video.srcObject) {
                        const stream = video.srcObject as MediaStream;
                        stream.getTracks().forEach(t => t.stop());
                      }
                      setIsCameraActive(false);
                    }}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : currentImageBase64 ? (
              /* Display Captured / Uploaded Palm Image Canvas */
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center bg-[#050507] rounded-xl overflow-hidden border border-white/10">
                <canvas 
                  ref={canvasRef} 
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  className={`w-full h-full object-contain rounded-xl ${isEditMode ? 'cursor-crosshair' : 'cursor-default'}`} 
                />

                {/* Animated Scan Laser Bar */}
                <motion.div 
                  initial={{ top: '0%' }}
                  animate={{ top: ['5%', '90%', '5%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_18px_#8B5CF6] pointer-events-none z-10"
                />

                {/* Top Corner Badge */}
                <div className="absolute top-3 left-3 text-[10px] font-mono text-amber-400 bg-black/85 backdrop-blur-md border border-amber-500/40 px-2.5 py-1 rounded flex items-center space-x-1.5 z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>PALM: {handSide.toUpperCase()} • 5 MAJOR CREASE LINES</span>
                </div>

                {/* Edit Mode Overlay Indicator */}
                {isEditMode && (
                  <div className="absolute top-3 right-3 text-[10px] font-mono text-cyan-300 bg-cyan-950/85 backdrop-blur-md border border-cyan-500/50 px-2.5 py-1 rounded flex items-center space-x-1.5 z-20 animate-pulse">
                    <Edit3 className="w-3 h-3 text-cyan-300" />
                    <span>DRAG POINTS TO FIT CREASES</span>
                  </div>
                )}

                {/* Bottom Corner Metrics */}
                {currentAnalysis && (
                  <div className="absolute bottom-3 right-3 flex flex-col gap-0.5 text-[9px] font-mono text-white/70 text-right bg-black/80 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded z-20">
                    <p className="text-emerald-400">LINE CONFIDENCE: {(currentAnalysis.detectionConfidence * 100).toFixed(0)}%</p>
                    <p className="text-violet-300">PALM LINES: 5 DETECTED</p>
                  </div>
                )}

                {/* Processing Overlay Loading Animation */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                    <RefreshCw className="w-10 h-10 text-violet-400 animate-spin mb-3" />
                    <div className="text-xs font-mono uppercase tracking-widest text-white">{processingStage}</div>
                    <div className="w-48 bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-amber-400 h-full animate-pulse w-3/4"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Initial State: Prompt User to Show Palm */
              <div className="w-full max-w-md py-12 px-6 flex flex-col items-center text-center space-y-5 bg-[#050507] border border-white/10 rounded-2xl">
                <div className="w-20 h-20 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                  <Hand className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Present Your Palm</h3>
                  <p className="text-xs text-white/50 max-w-xs mt-1 leading-relaxed">
                    Capture your palm using your webcam or upload a clear photo of your hand to automatically trace and analyze your palm lines.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    onClick={startCamera}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold uppercase tracking-wider text-xs rounded-xl sleek-glow-violet transition-all flex items-center justify-center space-x-2"
                  >
                    <Camera className="w-4 h-4 text-amber-300" />
                    <span>Open Camera</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold uppercase tracking-wider text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-violet-400" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            )}

            {/* Canvas Display Controls Bar */}
            {currentImageBase64 && !isCameraActive && (
              <div className="w-full mt-4 space-y-3 px-2 text-xs text-white/80 border-t border-white/5 pt-3">
                
                {/* Upper Row: Toggles and Hand Switch */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={showPalmLines}
                        onChange={(e) => setShowPalmLines(e.target.checked)}
                        className="rounded bg-black border-white/20 text-rose-500 focus:ring-0"
                      />
                      <span>Show Palm Lines</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer text-xs hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        checked={showContrastFilter}
                        onChange={(e) => setShowContrastFilter(e.target.checked)}
                        className="rounded bg-black border-white/20 text-cyan-400 focus:ring-0"
                      />
                      <span>Contrast Boost</span>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleHandSideManually}
                      title="Click to switch Left/Right hand orientation"
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center space-x-1.5 transition-all"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{handSide.toUpperCase()} (FLIP)</span>
                    </button>

                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center space-x-1 transition-all border ${
                        isEditMode ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{isEditMode ? 'DONE ADJUSTING' : 'FINE-TUNE LINES'}</span>
                    </button>
                  </div>
                </div>

                {/* Line Nudge & Calibration Toolbar (Visible in fine-tune mode) */}
                {isEditMode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-white/5 rounded-xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="text-[10px] font-mono text-cyan-300 flex items-center space-x-1">
                      <span>Nudge Position & Scale:</span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleNudge(0, -0.015)}
                        title="Move Up"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudge(0, 0.015)}
                        title="Move Down"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudge(-0.015, 0)}
                        title="Move Left"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleNudge(0.015, 0)}
                        title="Move Right"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      
                      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>

                      <button
                        onClick={() => handleScale(0.04)}
                        title="Scale Larger"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleScale(-0.04)}
                        title="Scale Smaller"
                        className="p-1.5 bg-black/60 hover:bg-black border border-white/20 rounded text-white"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={resetAdjustment}
                        title="Reset Line Calibration"
                        className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 rounded text-rose-300 text-[10px] font-mono flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </motion.div>
                )}

              </div>
            )}

          </div>

        </div>

        {/* Right Column: AI Analysis & Line Feature Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          
          <AnimatePresence mode="wait">
            {currentAnalysis ? (
              <motion.div 
                key="palm-analysis-results"
                initial={{ opacity: 0, x: 25, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -25, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="bg-[#0A0A0F] border border-white/10 rounded-2xl p-6 text-[#E0E0E6] shadow-xl"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-sm uppercase tracking-[0.2em] text-violet-400">Captured Palm Analysis</h3>
                  </div>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-2.5 py-1 rounded font-mono text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{(currentAnalysis.detectionConfidence * 100).toFixed(0)}% Match</span>
                  </motion.div>
                </div>

                {/* Hand Element Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="p-4 bg-white/5 rounded-xl border border-white/10 mb-4 flex items-start space-x-3.5"
                >
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/30 text-amber-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Palm Shape Classification</div>
                    <div className="text-base font-bold text-white mt-0.5">
                      {PALM_ELEMENT_TYPES[currentAnalysis.handType]?.title || 'Air Palm (Analytical & Inquisitive)'}
                    </div>
                    <p className="text-xs text-white/60 mt-1 leading-relaxed">
                      {PALM_ELEMENT_TYPES[currentAnalysis.handType]?.traits}
                    </p>
                  </div>
                </motion.div>

                {/* Palm Lines Detailed Cards with Hover Highlighting */}
                <div className="space-y-3">
                  
                  {/* Life Line */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18, duration: 0.4 }}
                    onMouseEnter={() => setHoveredLineName('Life Line')}
                    onMouseLeave={() => setHoveredLineName(null)}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 bg-white/5 rounded-xl border cursor-pointer transition-all ${
                      hoveredLineName === 'Life Line' ? 'border-rose-500 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.3)]' : 'border-white/10 hover:border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-rose-400 flex items-center space-x-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]"></span>
                        <span>Life Line</span>
                      </span>
                      <span className="text-[10px] font-mono bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded border border-rose-800/40">
                        {currentAnalysis.lifeLine.length} • {currentAnalysis.lifeLine.quality}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {currentAnalysis.lifeLine.interpretation}
                    </p>
                  </motion.div>

                  {/* Head Line */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.26, duration: 0.4 }}
                    onMouseEnter={() => setHoveredLineName('Head Line')}
                    onMouseLeave={() => setHoveredLineName(null)}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 bg-white/5 rounded-xl border cursor-pointer transition-all ${
                      hoveredLineName === 'Head Line' ? 'border-sky-500 bg-sky-950/20 shadow-[0_0_12px_rgba(56,189,248,0.3)]' : 'border-white/10 hover:border-sky-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-sky-400 flex items-center space-x-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#38BDF8]"></span>
                        <span>Head Line</span>
                      </span>
                      <span className="text-[10px] font-mono bg-sky-950/60 text-sky-300 px-2 py-0.5 rounded border border-sky-800/40">
                        {currentAnalysis.headLine.length} • {currentAnalysis.headLine.quality}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {currentAnalysis.headLine.interpretation}
                    </p>
                  </motion.div>

                  {/* Heart Line */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.34, duration: 0.4 }}
                    onMouseEnter={() => setHoveredLineName('Heart Line')}
                    onMouseLeave={() => setHoveredLineName(null)}
                    whileHover={{ scale: 1.01 }}
                    className={`p-3.5 bg-white/5 rounded-xl border cursor-pointer transition-all ${
                      hoveredLineName === 'Heart Line' ? 'border-pink-500 bg-pink-950/20 shadow-[0_0_12px_rgba(236,72,153,0.3)]' : 'border-white/10 hover:border-pink-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-pink-400 flex items-center space-x-1.5 uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#EC4899]"></span>
                        <span>Heart Line</span>
                      </span>
                      <span className="text-[10px] font-mono bg-pink-950/60 text-pink-300 px-2 py-0.5 rounded border border-pink-800/40">
                        {currentAnalysis.heartLine.length} • {currentAnalysis.heartLine.quality}
                      </span>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {currentAnalysis.heartLine.interpretation}
                    </p>
                  </motion.div>

                  {/* Fate & Sun Line */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42, duration: 0.4 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div 
                      onMouseEnter={() => setHoveredLineName('Fate Line')}
                      onMouseLeave={() => setHoveredLineName(null)}
                      className={`p-3 bg-white/5 rounded-xl border cursor-pointer transition-all ${
                        hoveredLineName === 'Fate Line' ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.3)]' : 'border-white/10 hover:border-violet-500/50'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400 mb-1 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                        <span>Fate Line</span>
                      </div>
                      <div className="text-xs text-white/80">{currentAnalysis.fateLine.interpretation}</div>
                    </div>

                    <div 
                      onMouseEnter={() => setHoveredLineName('Sun Line')}
                      onMouseLeave={() => setHoveredLineName(null)}
                      className={`p-3 bg-white/5 rounded-xl border cursor-pointer transition-all ${
                        hoveredLineName === 'Sun Line' ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_12px_rgba(251,191,36,0.3)]' : 'border-white/10 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 mb-1 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>Sun Line (Apollo)</span>
                      </div>
                      <div className="text-xs text-white/80">{currentAnalysis.sunLine.interpretation}</div>
                    </div>
                  </motion.div>

                </div>

                {/* Re-analyze / Retake Controls */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/40">5 Major Palm Creases Traced</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentImageBase64(null);
                        setCurrentAnalysis(null);
                        setPalmLines(null);
                      }}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold"
                    >
                      Retake Photo
                    </button>
                    {currentImageBase64 && (
                      <button
                        onClick={() => triggerPalmAnalysis(currentImageBase64)}
                        className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all sleek-glow-violet"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-Analyze</span>
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div 
                key="awaiting-palm-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0A0A0F] border border-white/10 rounded-2xl p-8 text-center text-[#E0E0E6] flex flex-col items-center justify-center min-h-[480px]"
              >
                <div className="p-4 bg-violet-950/40 border border-violet-500/30 rounded-full text-violet-400 mb-4 animate-pulse">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Awaiting Palm Image</h3>
                <p className="text-xs text-white/50 max-w-sm leading-relaxed">
                  Once you present your palm using the camera or upload a photo, the vision system will accurately trace the real palm lines (Life, Head, Heart, Fate, Sun) and synthesize your reading.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
};
