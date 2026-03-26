import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const clientGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.currentUser?.role === 'client') {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
