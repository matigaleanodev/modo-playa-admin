import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have menu labels', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.appPages.length).toEqual(6);
    expect(app.labels.length).toEqual(6);
    expect(app.appPages[0].title).toBe('Inbox');
    expect(app.appPages[1].title).toBe('Outbox');
  });

  it('should have urls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.appPages.length).toEqual(6);
    expect(app.appPages[0].url).toEqual('/folder/inbox');
    expect(app.appPages[1].url).toEqual('/folder/outbox');
  });
});
