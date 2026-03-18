export interface RgbColor {
  b: number;
  g: number;
  r: number;
}

export interface RuntimeState {
  dpr: number;
  height: number;
  primary: RgbColor;
  scrollProgress: number;
  width: number;
}

const DEFAULT_PRIMARY = '#018741';
const FULL_TURN = Math.PI * 2;
const DIAGONAL_OVERLAY_REACTIVE = true;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function blendChannel(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function blendColor(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    r: blendChannel(from.r, to.r, amount),
    g: blendChannel(from.g, to.g, amount),
    b: blendChannel(from.b, to.b, amount),
  };
}

function softenColor(color: RgbColor, amount: number): RgbColor {
  return blendColor(color, { r: 255, g: 255, b: 255 }, amount);
}

function toRgbaString(color: RgbColor, alpha: number) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

function hexToRgb(value: string): RgbColor | null {
  const hex = value.trim().replace('#', '');

  if (![3, 6].includes(hex.length) || /[^0-9a-f]/i.test(hex)) {
    return null;
  }

  const normalizedHex =
    hex.length === 3
      ? hex
          .split('')
          .map((character) => `${character}${character}`)
          .join('')
      : hex;

  return {
    r: Number.parseInt(normalizedHex.slice(0, 2), 16),
    g: Number.parseInt(normalizedHex.slice(2, 4), 16),
    b: Number.parseInt(normalizedHex.slice(4, 6), 16),
  };
}

function rgbFunctionToRgb(value: string): RgbColor | null {
  const matches = value.match(/[\d.]+/g);

  if (!matches || matches.length < 3) {
    return null;
  }

  const [r, g, b] = matches.map((part) => Number.parseFloat(part));

  if ([r, g, b].some((part) => Number.isNaN(part))) {
    return null;
  }

  return { r, g, b };
}

function parseCssColor(value: string, fallback: string): RgbColor {
  return (
    hexToRgb(value) ||
    rgbFunctionToRgb(value) ||
    hexToRgb(fallback) || { r: 0, g: 0, b: 0 }
  );
}

function drawDiagonalOverlayShape(
  context: CanvasRenderingContext2D,
  runtime: RuntimeState,
  motionEnabled: boolean
) {
  const { height, primary: color, scrollProgress, width } = runtime;
  const maxDimension = Math.max(width, height);
  const scrollShiftX = motionEnabled ? (scrollProgress - 0.5) * width * -0.08 : 0;
  const scrollShiftY = motionEnabled ? (scrollProgress - 0.5) * height * 0.1 : 0;
  const diagonalStartX = width * 1.26 + scrollShiftX;
  const diagonalStartY = -height * 0.28 + scrollShiftY;
  const diagonalEndX = -width * 0.34 + scrollShiftX;
  const diagonalEndY = height * 1.24 + scrollShiftY;
  const rightEdgeX = width * 1.34 + scrollShiftX;
  const bottomEdgeY = height * 1.3 + scrollShiftY;
  const shapeGradient = context.createLinearGradient(
    diagonalStartX,
    diagonalStartY,
    rightEdgeX,
    bottomEdgeY
  );

  shapeGradient.addColorStop(0, toRgbaString(softenColor(color, 0.16), 0.3));
  shapeGradient.addColorStop(0.34, toRgbaString(color, 0.24));
  shapeGradient.addColorStop(1, toRgbaString(color, 0.14));

  context.save();
  context.beginPath();
  context.moveTo(diagonalStartX, diagonalStartY);
  context.lineTo(diagonalEndX, diagonalEndY);
  context.lineTo(rightEdgeX, bottomEdgeY);
  context.lineTo(rightEdgeX, diagonalStartY);
  context.closePath();
  context.fillStyle = shapeGradient;
  context.fill();
  context.restore();

  const edgeGradient = context.createLinearGradient(
    diagonalStartX,
    diagonalStartY,
    diagonalEndX,
    diagonalEndY
  );

  edgeGradient.addColorStop(0, toRgbaString(softenColor(color, 0.1), 0.18));
  edgeGradient.addColorStop(1, toRgbaString(color, 0.08));

  context.save();
  context.beginPath();
  context.moveTo(diagonalStartX, diagonalStartY);
  context.lineTo(diagonalEndX, diagonalEndY);
  context.lineWidth = maxDimension * 0.12;
  context.strokeStyle = edgeGradient;
  context.stroke();
  context.restore();

  const cornerGlowX = width * 1.08 + scrollShiftX;
  const cornerGlowY = height * 1.02 + scrollShiftY;
  const cornerGlow = context.createRadialGradient(
    cornerGlowX,
    cornerGlowY,
    width * 0.08,
    cornerGlowX,
    cornerGlowY,
    maxDimension * 0.72
  );

  cornerGlow.addColorStop(0, toRgbaString(softenColor(color, 0.12), 0.18));
  cornerGlow.addColorStop(0.55, toRgbaString(color, 0.08));
  cornerGlow.addColorStop(1, toRgbaString(color, 0));

  context.save();
  context.fillStyle = cornerGlow;
  context.beginPath();
  context.arc(cornerGlowX, cornerGlowY, maxDimension * 0.72, 0, FULL_TURN);
  context.fill();
  context.restore();
}

export function drawAmbientDesignScene(
  context: CanvasRenderingContext2D,
  runtime: RuntimeState,
  motionEnabled: boolean
) {
  drawDiagonalOverlayShape(context, runtime, motionEnabled);
}

export function getAmbientMotionEnabled(reducedMotion: boolean) {
  return DIAGONAL_OVERLAY_REACTIVE && !reducedMotion;
}

export function getPrimaryColor() {
  const computedStyle = getComputedStyle(document.documentElement);

  return parseCssColor(
    computedStyle.getPropertyValue('--color-ambient-primary'),
    DEFAULT_PRIMARY
  );
}

export function getScrollProgress() {
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight
  );
  const scrollableHeight = Math.max(documentHeight - window.innerHeight, 1);

  return clamp(window.scrollY / scrollableHeight, 0, 1);
}
