import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';

import { AccessibilityService } from '../core/accessibility.service';

@Component({
  selector: 'app-accessibility-panel',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  templateUrl: './accessibility-panel.component.html',
  styleUrl: './accessibility-panel.component.scss',
})
export class AccessibilityPanelComponent {
  readonly accessibility = inject(AccessibilityService);
  open = false;
  settings$ = this.accessibility.settings$;
  reading$ = this.accessibility.reading$;

  @ViewChild('toggleButton') toggleButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('firstControl') firstControl?: ElementRef<HTMLButtonElement>;
  @ViewChild('panel') panel?: ElementRef<HTMLElement>;

  togglePanel(): void {
    this.open = !this.open;
    if (this.open) {
      setTimeout(() => this.firstControl?.nativeElement.focus(), 0);
    } else {
      setTimeout(() => this.toggleButton?.nativeElement.focus(), 0);
    }
  }

  closePanel(): void {
    this.open = false;
    setTimeout(() => this.toggleButton?.nativeElement.focus(), 0);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.closePanel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.open || event.key !== 'Tab' || !this.panel?.nativeElement) {
      return;
    }

    const focusables = this.panel.nativeElement.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
