import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { SessionService } from '@auth/services/session.service';
import { NavService } from '@shared/services/nav/nav.service';

export const noAuthGuard: CanMatchFn = () => {
  const session = inject(SessionService);
  const nav = inject(NavService);

  if (!session.isAuthenticated()) {
    return true;
  }

  nav.root('/app/dashboard');
  return false;
};
