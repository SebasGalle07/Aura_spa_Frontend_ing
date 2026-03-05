import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

import { NavbarComponent } from './shared/navbar.component';
import { FooterComponent } from './shared/footer.component';
import { AuthService } from './core/auth.service';
import { IdleService } from './core/idle.service';
import { CompanyService } from './core/company.service';
import { Toast, ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, NgIf, NgFor, NgClass],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  private sub = new Subscription();
  toasts: Array<Toast & { id: number }> = [];
  private toastId = 0;

  constructor(
    private auth: AuthService,
    private idle: IdleService,
    private company: CompanyService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.sub.add(this.auth.user$.subscribe((user) => (user ? this.idle.start() : this.idle.stop())));
    this.sub.add(this.auth.restoreSession().subscribe());
    this.sub.add(this.company.loadPublic().subscribe());
    this.sub.add(
      this.toast.toast$.subscribe((toast) => {
        const id = ++this.toastId;
        this.toasts = [...this.toasts, { ...toast, id }];
        setTimeout(() => {
          this.toasts = this.toasts.filter((item) => item.id !== id);
        }, 3500);
      }),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}


