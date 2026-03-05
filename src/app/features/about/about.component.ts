import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Observable } from 'rxjs';

import { CompanyService } from '../../core/company.service';
import { CompanyData } from '../../core/models';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  company$: Observable<CompanyData | null>;

  constructor(private company: CompanyService) {
    this.company$ = this.company.company$;
  }
}


