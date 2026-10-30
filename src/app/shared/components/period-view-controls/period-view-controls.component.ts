import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MonthPeriodPickerComponent } from '../month-period-picker/month-period-picker.component';

@Component({
  selector: 'app-period-view-controls',
  imports: [MonthPeriodPickerComponent, RouterLink],
  templateUrl: './period-view-controls.component.html',
  styleUrl: './period-view-controls.component.css',
})
export class PeriodViewControlsComponent {
  readonly monthValue = input.required<string>();
  readonly cycleStartDay = input(1);
  readonly viewingCurrentPeriod = input(true);

  readonly monthValueChange = output<string>();
  readonly goToCurrentPeriod = output<void>();
}
