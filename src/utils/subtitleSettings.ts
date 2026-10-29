import type { CSSProperties } from 'react';

export type SubtitleEdgeStyle = 'none' | 'shadow' | 'outline';
export type SubtitlePosition = 'top' | 'center' | 'bottom';

export interface SubtitleSettings {
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  edgeStyle: SubtitleEdgeStyle;
  borderRadius: number;
  position: SubtitlePosition;
}

export const SUBTITLE_SETTINGS_KEY = 'signify-subtitle-settings';

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 16,
  textColor: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 80,
  edgeStyle: 'shadow',
  borderRadius: 8,
  position: 'bottom',
};

const TEXT_COLORS = new Set(['#FFFFFF', '#FDE047', '#000000']);
const EDGE_STYLES = new Set<SubtitleEdgeStyle>(['none', 'shadow', 'outline']);
const POSITIONS = new Set<SubtitlePosition>(['top', 'center', 'bottom']);

function boundedNumber(value: unknown, fallback: number, min: number, max: number, step: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(max, Math.max(min, value));
  return min + Math.round((bounded - min) / step) * step;
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function loadSubtitleSettings(): SubtitleSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_SUBTITLE_SETTINGS };
  try {
    const stored = window.localStorage.getItem(SUBTITLE_SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_SUBTITLE_SETTINGS };
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ...DEFAULT_SUBTITLE_SETTINGS };
    }

    const merged = { ...DEFAULT_SUBTITLE_SETTINGS, ...parsed } as Record<string, unknown>;
    const textColor = typeof merged.textColor === 'string' ? merged.textColor.toUpperCase() : '';
    const edgeStyle = merged.edgeStyle as SubtitleEdgeStyle;
    const position = merged.position as SubtitlePosition;
    return {
      fontSize: boundedNumber(merged.fontSize, DEFAULT_SUBTITLE_SETTINGS.fontSize, 12, 22, 1),
      textColor: TEXT_COLORS.has(textColor) ? textColor : DEFAULT_SUBTITLE_SETTINGS.textColor,
      backgroundColor: isHexColor(merged.backgroundColor)
        ? merged.backgroundColor.toUpperCase() : DEFAULT_SUBTITLE_SETTINGS.backgroundColor,
      backgroundOpacity: boundedNumber(merged.backgroundOpacity, DEFAULT_SUBTITLE_SETTINGS.backgroundOpacity, 0, 100, 5),
      edgeStyle: EDGE_STYLES.has(edgeStyle) ? edgeStyle : DEFAULT_SUBTITLE_SETTINGS.edgeStyle,
      borderRadius: boundedNumber(merged.borderRadius, DEFAULT_SUBTITLE_SETTINGS.borderRadius, 0, 16, 1),
      position: POSITIONS.has(position) ? position : DEFAULT_SUBTITLE_SETTINGS.position,
    };
  } catch {
    return { ...DEFAULT_SUBTITLE_SETTINGS };
  }
}

export function saveSubtitleSettings(settings: SubtitleSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SUBTITLE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Keep subtitle controls usable when browser storage is unavailable.
  }
}

export function subtitleBackgroundColor(color: string, opacity: number): string {
  const safeColor = isHexColor(color) ? color : DEFAULT_SUBTITLE_SETTINGS.backgroundColor;
  const red = Number.parseInt(safeColor.slice(1, 3), 16);
  const green = Number.parseInt(safeColor.slice(3, 5), 16);
  const blue = Number.parseInt(safeColor.slice(5, 7), 16);
  const alpha = Math.min(100, Math.max(0, opacity)) / 100;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function subtitleTextStyle(settings: SubtitleSettings): CSSProperties {
  const outlineColor = settings.textColor.toUpperCase() === '#000000' ? '#FFFFFF' : '#000000';
  const outlineShadow = `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`;
  return {
    color: settings.textColor,
    fontSize: `${settings.fontSize}px`,
    textShadow: settings.edgeStyle === 'shadow'
      ? '0 1px 3px rgba(0,0,0,0.8)'
      : settings.edgeStyle === 'outline' ? outlineShadow : 'none',
    WebkitTextStroke: settings.edgeStyle === 'outline' ? `0.5px ${outlineColor}` : undefined,
  };
}
