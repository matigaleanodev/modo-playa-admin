/* eslint-disable @angular-eslint/component-selector */
import { Component, input } from '@angular/core';

@Component({
  selector: 'ion-menu-button',
  standalone: true,
  template: '',
  host: {
    type: 'button',
    'aria-label': 'Open menu',
    '[attr.menu]': 'menu() ?? null',
    '[attr.auto-hide]': 'autoHide() ? "true" : "false"',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
})
export class IonMenuButtonStubComponent {
  readonly menu = input<string | null>(null);
  readonly autoHide = input<boolean>(true);
  readonly disabled = input<boolean>(false);
}
