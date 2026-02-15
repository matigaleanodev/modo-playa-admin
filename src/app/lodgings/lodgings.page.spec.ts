import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LodgingsPage } from './lodgings.page';

describe('LodgingsPage', () => {
  let component: LodgingsPage;
  let fixture: ComponentFixture<LodgingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LodgingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
