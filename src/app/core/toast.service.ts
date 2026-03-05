import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<Toast>();
  toast$ = this.subject.asObservable();

  show(message: string, type: ToastType = 'success'): void {
    this.subject.next({ message, type });
  }
}


