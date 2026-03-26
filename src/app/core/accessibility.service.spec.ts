import { TestBed } from '@angular/core/testing';

import { AccessibilityService } from './accessibility.service';

describe('AccessibilityService', () => {
  beforeEach(() => {
    localStorage.removeItem('aura_spa_accessibility_settings');
    document.body.innerHTML = `
      <div class="a11y-root">
        <main>
          <p id="content-text" style="font-size: 16px;">Contenido principal</p>
          <button id="content-button" style="font-size: 14px;">Accion</button>
        </main>
      </div>
      <div class="toast-stack">
        <div class="toast" id="toast-message" style="font-size: 14px;">Mensaje</div>
      </div>
    `;

    TestBed.configureTestingModule({});
  });

  it('should scale general content text and not only buttons when font size increases', () => {
    const service = TestBed.inject(AccessibilityService);
    const paragraph = document.getElementById('content-text') as HTMLElement;
    const button = document.getElementById('content-button') as HTMLElement;

    service.increaseFontScale();

    expect(paragraph.style.fontSize).toBe('17.6px');
    expect(button.style.fontSize).toBe('15.4px');
  });
});
