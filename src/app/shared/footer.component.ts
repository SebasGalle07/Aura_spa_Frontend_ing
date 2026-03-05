import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

import { CompanyService } from '../core/company.service';
import { Branding, CompanyData } from '../core/models';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  company$: Observable<CompanyData | null>;
  branding$: Observable<Branding | null>;

  constructor(private company: CompanyService) {
    this.company$ = this.company.company$;
    this.branding$ = this.company.branding$;
  }
}


