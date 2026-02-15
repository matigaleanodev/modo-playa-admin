import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContacsPage } from './contacs.page';

describe('ContacsPage', () => {
  let component: ContacsPage;
  let fixture: ComponentFixture<ContacsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ContacsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
