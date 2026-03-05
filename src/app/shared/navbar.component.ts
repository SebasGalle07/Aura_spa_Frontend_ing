import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

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
export class NavbarComponent {
  user$: Observable<User | null>;
  branding$: Observable<Branding | null>;
  menuOpen = false;

  constructor(private auth: AuthService, private company: CompanyService) {
    this.user$ = this.auth.user$;
    this.branding$ = this.company.branding$;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.auth.logout(true);
  }
}


