import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonMenuButton } from '@ionic/angular/standalone';
import { IonMenuButtonStubComponent } from './stubs/ion-menu-button.stub.component';

export function stubIonMenuButton(component: Type<unknown>): void {
  TestBed.overrideComponent(component, {
    remove: {
      imports: [IonMenuButton],
    },
    add: {
      imports: [IonMenuButtonStubComponent],
    },
  });
}
