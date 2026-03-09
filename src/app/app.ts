import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

import { NavbarComponent } from './shared/navbar.component';
import { FooterComponent } from './shared/footer.component';
import { AccessibilityPanelComponent } from './shared/accessibility-panel.component';
import { AuthService } from './core/auth.service';
import { IdleService } from './core/idle.service';
import { CompanyService } from './core/company.service';
import { Toast, ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AccessibilityPanelComponent, NgIf, NgFor, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private readonly defaultFavicon = 'favicon.ico';
  private sub = new Subscription();
  private toastTimers = new Map<number, ReturnType<typeof setTimeout>>();
  toasts: Array<Toast & { id: number }> = [];
  private toastId = 0;

  constructor(
    private auth: AuthService,
    private idle: IdleService,
    private company: CompanyService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.setFavicon();
    this.sub.add(this.auth.user$.subscribe((user) => (user ? this.idle.start() : this.idle.stop())));
    this.sub.add(this.auth.restoreSession().subscribe());
    this.sub.add(this.company.branding$.subscribe((branding) => this.setFavicon(branding?.spLogo ?? null)));
    this.sub.add(this.company.loadPublic().subscribe({ error: () => {} }));
    this.sub.add(
      this.toast.toast$.subscribe((toast) => {
        const id = ++this.toastId;
        this.toasts = [...this.toasts, { ...toast, id }];
        const timer = setTimeout(() => {
          this.toasts = this.toasts.filter((item) => item.id !== id);
          this.toastTimers.delete(id);
        }, 2500);
        this.toastTimers.set(id, timer);
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.toastTimers.forEach((timer) => clearTimeout(timer));
    this.toastTimers.clear();
  }

  private setFavicon(url?: string | null): void {
    const iconUrl = (url || '').trim() || this.defaultFavicon;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = iconUrl;
    if (iconUrl.endsWith('.svg')) {
      link.type = 'image/svg+xml';
      return;
    }
    if (iconUrl.endsWith('.png')) {
      link.type = 'image/png';
      return;
    }
    link.type = 'image/x-icon';
  }
}
