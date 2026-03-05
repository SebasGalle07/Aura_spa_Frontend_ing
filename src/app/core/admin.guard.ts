import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.currentUser?.role === 'admin') {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};


