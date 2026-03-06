import { Component, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable, Subscription, filter } from 'rxjs';

import { AuthService } from '../core/auth.service';
import { CompanyService } from '../core/company.service';
import { Branding, User } from '../core/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnDestroy {
  user$: Observable<User | null>;
  branding$: Observable<Branding | null>;
  menuOpen = false;
  private sub = new Subscription();

  constructor(private auth: AuthService, private company: CompanyService, router: Router) {
    this.user$ = this.auth.user$;
    this.branding$ = this.company.branding$;

    this.sub.add(
      router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => this.closeMenu()),
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout(true);
  }
}
