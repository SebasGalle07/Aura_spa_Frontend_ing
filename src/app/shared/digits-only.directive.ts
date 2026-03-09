import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input[digitsOnly]',
  standalone: true,
})
export class DigitsOnlyDirective {
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) {
      return;
    }
    const sanitized = input.value.replace(/\D+/g, '');
    if (input.value !== sanitized) {
      input.value = sanitized;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const sanitized = pasted.replace(/\D+/g, '');
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
}
