import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

import { CompanyService } from '../../core/company.service';
import { Branding } from '../../core/models';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  branding$: Observable<Branding | null>;

  constructor(private company: CompanyService) {
    this.branding$ = this.company.branding$;
  }
}

