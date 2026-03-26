import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AccessibilitySettings {
  darkContrast: boolean;
  lightContrast: boolean;
  inverted: boolean;
  monochrome: boolean;
  lowSaturation: boolean;
  highSaturation: boolean;
  highlightLinks: boolean;
  highlightHeadings: boolean;
  readingMode: boolean;
  fontScale: number;
  lineHeight: number;
  letterSpacing: number;
  contentScale: number;
}

const STORAGE_KEY = 'aura_spa_accessibility_settings';

const DEFAULT_SETTINGS: AccessibilitySettings = {
  darkContrast: false,
  lightContrast: false,
  inverted: false,
  monochrome: false,
  lowSaturation: false,
  highSaturation: false,
  highlightLinks: false,
  highlightHeadings: false,
  readingMode: false,
  fontScale: 1,
  lineHeight: 1.5,
  letterSpacing: 0,
  contentScale: 1,
};

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private static readonly TEXT_SELECTOR = [
    '.a11y-root h1',
    '.a11y-root h2',
    '.a11y-root h3',
    '.a11y-root h4',
    '.a11y-root h5',
    '.a11y-root h6',
    '.a11y-root p',
    '.a11y-root span',
    '.a11y-root li',
    '.a11y-root a',
    '.a11y-root button',
    '.a11y-root label',
    '.a11y-root input',
    '.a11y-root textarea',
    '.a11y-root select',
    '.a11y-root small',
    '.a11y-root strong',
    '.a11y-root legend',
    '.a11y-root td',
    '.a11y-root th',
    '.toast-stack .toast',
  ].join(', ');

  private settingsSubject = new BehaviorSubject<AccessibilitySettings>(DEFAULT_SETTINGS);
  settings$ = this.settingsSubject.asObservable();
  private readingSubject = new BehaviorSubject<boolean>(false);
  reading$ = this.readingSubject.asObservable();
  private mutationObserver?: MutationObserver;
  readonly speechSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';
  private utterance?: SpeechSynthesisUtterance;

  constructor() {
    this.load();
    this.watchDomChanges();
  }

  get current(): AccessibilitySettings {
    return this.settingsSubject.value;
  }

  setDarkContrast(enabled: boolean): void {
    this.update({
      darkContrast: enabled,
      lightContrast: enabled ? false : this.current.lightContrast,
    });
  }

  setLightContrast(enabled: boolean): void {
    this.update({
      lightContrast: enabled,
      darkContrast: enabled ? false : this.current.darkContrast,
    });
  }

  setInverted(enabled: boolean): void {
    this.update({ inverted: enabled });
  }

  setMonochrome(enabled: boolean): void {
    this.update({ monochrome: enabled });
  }

  setLowSaturation(enabled: boolean): void {
    this.update({
      lowSaturation: enabled,
      highSaturation: enabled ? false : this.current.highSaturation,
    });
  }

  setHighSaturation(enabled: boolean): void {
    this.update({
      highSaturation: enabled,
      lowSaturation: enabled ? false : this.current.lowSaturation,
    });
  }

  setHighlightLinks(enabled: boolean): void {
    this.update({ highlightLinks: enabled });
  }

  setHighlightHeadings(enabled: boolean): void {
    this.update({ highlightHeadings: enabled });
  }

  setReadingMode(enabled: boolean): void {
    this.update({ readingMode: enabled });
  }

  increaseFontScale(): void {
    this.update({ fontScale: Math.min(1.4, Number((this.current.fontScale + 0.1).toFixed(2))) });
  }

  decreaseFontScale(): void {
    this.update({ fontScale: Math.max(0.9, Number((this.current.fontScale - 0.1).toFixed(2))) });
  }

  increaseContentScale(): void {
    this.update({ contentScale: Math.min(1.2, Number((this.current.contentScale + 0.05).toFixed(2))) });
  }

  decreaseContentScale(): void {
    this.update({ contentScale: Math.max(0.9, Number((this.current.contentScale - 0.05).toFixed(2))) });
  }

  setLineHeight(value: number): void {
    const normalized = Math.max(1.2, Math.min(2, Number(value.toFixed(2))));
    this.update({ lineHeight: normalized });
  }

  setLetterSpacing(value: number): void {
    const normalized = Math.max(0, Math.min(3, Number(value.toFixed(2))));
    this.update({ letterSpacing: normalized });
  }

  toggleReadAloud(): void {
    if (!this.speechSupported) {
      return;
    }
    if (this.readingSubject.value) {
      this.stopReadAloud();
      return;
    }
    const main = document.querySelector('main');
    const text = (main?.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 12000));
    utterance.lang = 'es-CO';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => this.readingSubject.next(false);
    utterance.onerror = () => this.readingSubject.next(false);
    this.utterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    this.readingSubject.next(true);
  }

  stopReadAloud(): void {
    if (!this.speechSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    this.utterance = undefined;
    this.readingSubject.next(false);
  }

  reset(): void {
    this.stopReadAloud();
    this.settingsSubject.next(DEFAULT_SETTINGS);
    this.apply(DEFAULT_SETTINGS);
    this.persist(DEFAULT_SETTINGS);
  }

  private update(patch: Partial<AccessibilitySettings>): void {
    const next = { ...this.current, ...patch };
    this.settingsSubject.next(next);
    this.apply(next);
    this.persist(next);
  }

  private load(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.apply(DEFAULT_SETTINGS);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AccessibilitySettings>;
      const next = { ...DEFAULT_SETTINGS, ...parsed };
      this.settingsSubject.next(next);
      this.apply(next);
    } catch {
      this.apply(DEFAULT_SETTINGS);
    }
  }

  private persist(settings: AccessibilitySettings): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  private apply(settings: AccessibilitySettings): void {
    if (typeof document === 'undefined') {
      return;
    }
    const body = document.body;
    const root = document.documentElement;

    this.setClass(body, 'a11y-highlight-links', settings.highlightLinks);
    this.setClass(body, 'a11y-highlight-headings', settings.highlightHeadings);
    this.setClass(body, 'a11y-reading-mode', settings.readingMode);
    this.setClass(body, 'a11y-dark-contrast', settings.darkContrast);
    this.setClass(body, 'a11y-light-contrast', settings.lightContrast);
    this.setClass(body, 'a11y-inverted', settings.inverted);
    this.setClass(body, 'a11y-monochrome', settings.monochrome);
    this.setClass(body, 'a11y-low-saturation', settings.lowSaturation);
    this.setClass(body, 'a11y-high-saturation', settings.highSaturation);

    root.style.setProperty('--a11y-font-scale', String(settings.fontScale));
    root.style.setProperty('--a11y-line-height', String(settings.lineHeight));
    root.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}px`);
    root.style.setProperty('--a11y-content-scale', String(settings.contentScale));
    root.style.setProperty('--a11y-color-filter', this.buildFilter(settings));
    this.applyTextScaling(settings.fontScale);
  }

  private buildFilter(settings: AccessibilitySettings): string {
    const filters: string[] = [];

    if (settings.darkContrast) {
      filters.push('contrast(1.35)', 'brightness(0.8)');
    } else if (settings.lightContrast) {
      filters.push('contrast(1.2)', 'brightness(1.15)');
    }
    if (settings.inverted) {
      filters.push('invert(1)', 'hue-rotate(180deg)');
    }
    if (settings.monochrome) {
      filters.push('grayscale(1)');
    }
    if (settings.lowSaturation) {
      filters.push('saturate(0.65)');
    } else if (settings.highSaturation) {
      filters.push('saturate(1.35)');
    }

    return filters.length ? filters.join(' ') : 'none';
  }

  private setClass(target: HTMLElement, className: string, enabled: boolean): void {
    if (enabled) {
      target.classList.add(className);
    } else {
      target.classList.remove(className);
    }
  }

  private watchDomChanges(): void {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return;
    }

    this.mutationObserver = new MutationObserver(() => {
      this.applyTextScaling(this.current.fontScale);
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private applyTextScaling(fontScale: number): void {
    if (typeof document === 'undefined') {
      return;
    }

    const elements = document.querySelectorAll<HTMLElement>(AccessibilityService.TEXT_SELECTOR);
    elements.forEach((element) => {
      if (!element.dataset['a11yBaseFontSize']) {
        const computedFontSize = Number.parseFloat(window.getComputedStyle(element).fontSize);
        if (!Number.isFinite(computedFontSize) || computedFontSize <= 0) {
          return;
        }
        element.dataset['a11yBaseFontSize'] = String(computedFontSize);
      }

      const baseFontSize = Number.parseFloat(element.dataset['a11yBaseFontSize'] || '');
      if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) {
        return;
      }

      if (fontScale === 1) {
        element.style.removeProperty('font-size');
        return;
      }

      element.style.fontSize = `${Number((baseFontSize * fontScale).toFixed(2))}px`;
    });
  }
}
