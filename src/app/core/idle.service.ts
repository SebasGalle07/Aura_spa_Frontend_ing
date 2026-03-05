import { Injectable, NgZone } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class IdleService {
  private sub?: Subscription;

  constructor(private auth: AuthService, private zone: NgZone, private toast: ToastService) {}

  start(): void {
    this.stop();
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(window, 'scroll'),
      );
      this.sub = activity$
        .pipe(
          startWith(null),
          switchMap(() => timer(environment.idleTimeoutMs)),
        )
        .subscribe(() => {
          this.zone.run(() => {
            this.toast.show('Sesion finalizada por inactividad.', 'info');
            this.auth.logout(true);
          });
        });
    });
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }
}


