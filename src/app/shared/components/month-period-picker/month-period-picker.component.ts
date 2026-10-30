import {
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  formatMonthLabel,
  parseMonthInputValue,
  shiftMonthPeriod,
  toMonthInputValue,
} from '../../../core/utils/month.utils';

@Component({
  selector: 'app-month-period-picker',
  templateUrl: './month-period-picker.component.html',
  styleUrl: './month-period-picker.component.css',
})
export class MonthPeriodPickerComponent {
  readonly value = input('');
  readonly disabled = input(false);
  readonly min = input('2020-01');

  readonly valueChange = output<string>();

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement>>('nativeInput');

  protected readonly displayLabel = computed(() => {
    const parsed = parseMonthInputValue(this.value());
    if (!parsed) {
      return 'Selecionar mês';
    }
    return formatMonthLabel(parsed.year, parsed.month);
  });

  protected shift(delta: number): void {
    if (this.disabled()) {
      return;
    }
    const parsed = parseMonthInputValue(this.value());
    if (!parsed) {
      return;
    }
    const next = shiftMonthPeriod(parsed, delta);
    this.valueChange.emit(toMonthInputValue(next));
  }

  protected openNativePicker(): void {
    if (this.disabled()) {
      return;
    }
    const input = this.nativeInput()?.nativeElement;
    if (!input) {
      return;
    }
    input.showPicker?.();
    input.focus();
  }

  protected onNativeChange(value: string): void {
    if (this.disabled() || !value) {
      return;
    }
    this.valueChange.emit(value);
  }
}
