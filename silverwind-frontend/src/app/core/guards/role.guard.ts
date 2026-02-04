import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../stores/auth.store';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as UserRole[];
  const requiredOrgTypes = route.data['orgTypes'] as string[];

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  const userRole = authStore.userRole() as UserRole;
  const userOrgType = authStore.user()?.orgType;

  // Check Role (if specified)
  const roleMatch = !requiredRoles || (userRole && requiredRoles.includes(userRole));

  // Check OrgType (if specified)
  const orgMatch = !requiredOrgTypes || (userOrgType && requiredOrgTypes.includes(userOrgType));

  if (roleMatch && orgMatch) {
    return true;
  }

  // Redirect to dashboard if role doesn't match
  return router.createUrlTree(['/dashboard']);
};
