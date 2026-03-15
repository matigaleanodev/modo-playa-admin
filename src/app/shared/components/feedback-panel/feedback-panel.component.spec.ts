import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedbackPanelComponent } from './feedback-panel.component';

describe('FeedbackPanelComponent', () => {
  let component: FeedbackPanelComponent;
  let fixture: ComponentFixture<FeedbackPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackPanelComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Cargando datos');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render description and loading state when provided', () => {
    fixture.componentRef.setInput('description', 'Espera un momento.');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Cargando datos');
    expect(element.textContent).toContain('Espera un momento.');
    expect(element.querySelector('.feedback-panel__spinner')).not.toBeNull();
  });
});
