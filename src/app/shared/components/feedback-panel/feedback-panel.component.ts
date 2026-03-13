import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export type FeedbackTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

@Component({
  selector: 'app-feedback-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feedback-panel.component.html',
  styleUrls: ['./feedback-panel.component.scss'],
})
export class FeedbackPanelComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null>(null);
  readonly tone = input<FeedbackTone>('neutral');
  readonly loading = input<boolean>(false);
  readonly compact = input<boolean>(false);
}
