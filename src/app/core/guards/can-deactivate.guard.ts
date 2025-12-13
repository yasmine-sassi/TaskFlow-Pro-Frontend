import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

// Interface for components that can be deactivated
export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

export const canDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  // If component has canDeactivate method, call it
  if (component.canDeactivate) {
    return component.canDeactivate();
  }

  // Default: allow navigation
  return true;
};
