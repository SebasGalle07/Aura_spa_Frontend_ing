import { Directive, HostListener } from '@angular/core';

const ALLOWED_SINGLE_CHAR = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]$/;

@Directive({
  selector: 'input[lettersOnly]',
  standalone: true,
})
export class LettersOnlyDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    if (!ALLOWED_SINGLE_CHAR.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const sanitized = this.sanitize(input.value);
    if (input.value !== sanitized) {
      input.value = sanitized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const sanitized = this.sanitize(pasted);
    if (sanitized === pasted) {
      return;
    }

    event.preventDefault();
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = `${target.value.slice(0, start)}${sanitized}${target.value.slice(end)}`;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private sanitize(value: string): string {
    return value
      .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trimStart();
  }
}
