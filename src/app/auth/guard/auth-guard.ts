import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const nav = inject(NavService);

  if (session.isAuthenticated()) {
    return true;
  }

  nav.root('/login');
  return false;
};
