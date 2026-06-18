import {
  Component, output, signal, computed, OnInit
} from '@angular/core';

interface CalDay {
  date: Date | null;
  label: string;
  past: boolean;
  today: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  selectable: boolean;
}

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  template: `
    <div class="cal-wrapper">

      <!-- Header with instructions -->
      <div class="cal-instruction">
        @if (!startDate()) {
          <span class="cal-step active">① Select check-in date</span>
        } @else if (!endDate()) {
          <span class="cal-step active">② Select check-out date</span>
          <span class="cal-step">Check-in: <strong>{{ formatDisplay(startDate()!) }}</strong></span>
        } @else {
          <span class="cal-step done">
            Check-in: <strong>{{ formatDisplay(startDate()!) }}</strong>
          </span>
          <span class="cal-sep">→</span>
          <span class="cal-step done">
            Check-out: <strong>{{ formatDisplay(endDate()!) }}</strong>
          </span>
          <span class="cal-nights">({{ nights() }} night{{ nights() !== 1 ? 's' : '' }})</span>
          <button class="cal-clear" (click)="clear()">✕ Clear</button>
        }
      </div>

      <!-- Calendar grid -->
      <div class="cal-panel">
        <!-- Navigation -->
        <div class="cal-nav">
          <button class="cal-nav-btn" (click)="prevMonth()">‹</button>
          <span class="cal-month-label">{{ MONTHS[viewMonth()] }} {{ viewYear() }}</span>
          <button class="cal-nav-btn" (click)="nextMonth()">›</button>
        </div>

        <!-- Day headers -->
        <div class="cal-grid">
          @for (d of DAYS; track d) {
            <div class="cal-day-hdr">{{ d }}</div>
          }

          <!-- Day cells -->
          @for (day of days(); track $index) {
            @if (day.date === null) {
              <div class="cal-cell empty"></div>
            } @else {
              <button
                class="cal-cell"
                [class.past]="day.past"
                [class.today]="day.today"
                [class.start]="day.isStart"
                [class.end]="day.isEnd"
                [class.in-range]="day.inRange"
                [class.hover-target]="!day.past && !day.isStart"
                [disabled]="!day.selectable"
                (click)="selectDay(day.date!)"
                (mouseenter)="hoverDate.set(day.date)"
                (mouseleave)="hoverDate.set(null)"
              >{{ day.label }}</button>
            }
          }
        </div>
      </div>

    </div>
  `,
  styles: [`
    .cal-wrapper { width: 100%; }

    .cal-instruction {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
      padding: 0.75rem 1rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      margin-bottom: 0.75rem;
      font-size: 0.875rem;
    }

    .cal-step {
      color: var(--color-text-muted);
      &.active { color: var(--color-accent); font-weight: 500; }
      &.done   { color: var(--color-text); }
      strong   { color: var(--color-primary); }
    }

    .cal-sep    { color: var(--color-text-muted); }
    .cal-nights { font-size: 0.8rem; color: var(--color-text-muted); }

    .cal-clear {
      margin-left: auto;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 0.2rem 0.6rem;
      font-size: 0.8rem;
      cursor: pointer;
      color: var(--color-text-muted);
      &:hover { border-color: var(--color-danger); color: var(--color-danger); }
    }

    .cal-panel {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--color-surface-2);
    }

    .cal-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-primary);
    }

    .cal-nav-btn {
      background: none;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: var(--radius-sm);
      color: #fff;
      width: 28px; height: 28px;
      cursor: pointer;
      font-size: 1.1rem;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: rgba(255,255,255,0.15); }
    }

    .cal-month-label { color: #fff; font-weight: 500; font-size: 0.95rem; }

    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      padding: 0.5rem;
    }

    .cal-day-hdr {
      text-align: center;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
      padding: 0.3rem 0;
    }

    .cal-cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: none;
      background: transparent;
      color: var(--color-text);
      transition: background 0.1s, color 0.1s;
      position: relative;

      &.empty { pointer-events: none; }

      &:not(:disabled):hover { background: var(--color-surface); }

      &.today {
        font-weight: 700;
        &::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%; transform: translateX(-50%);
          width: 4px; height: 4px;
          border-radius: 50%;
          background: var(--color-accent);
        }
      }

      &.past, &:disabled {
        color: #ccc;
        cursor: not-allowed;
        pointer-events: none;
      }

      &.in-range {
        background: #e0e7ff;
        color: #3730a3;
        border-radius: 0;
      }

      &.start, &.end {
        background: var(--color-primary) !important;
        color: #fff !important;
        border-radius: var(--radius-sm) !important;
        font-weight: 600;
        z-index: 1;
      }
    }
  `],
})
export class CalendarComponent implements OnInit {
  readonly rangeSelected = output<{ checkIn: string; checkOut: string } | null>();

  readonly MONTHS = MONTHS;
  readonly DAYS   = DAYS;

  readonly viewYear  = signal(new Date().getFullYear());
  readonly viewMonth = signal(new Date().getMonth());
  readonly startDate = signal<Date | null>(null);
  readonly endDate   = signal<Date | null>(null);
  readonly hoverDate = signal<Date | null>(null);

  readonly nights = computed(() => {
    const s = this.startDate(), e = this.endDate();
    if (!s || !e) return 0;
    return Math.round((e.getTime() - s.getTime()) / 86_400_000);
  });

  readonly days = computed<CalDay[]>(() => {
    const year  = this.viewYear();
    const month = this.viewMonth();
    const today = new Date(); today.setHours(0,0,0,0);
    const start = this.startDate();
    const end   = this.endDate();
    const hover = this.hoverDate();

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const result: CalDay[] = [];

    // Empty padding cells
    for (let i = 0; i < firstWeekday; i++) {
      result.push({ date: null, label: '', past: false, today: false,
                    isStart: false, isEnd: false, inRange: false, selectable: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const past = date < today;
      const isToday = date.getTime() === today.getTime();
      const isStart = !!start && date.getTime() === start.getTime();
      const isEnd   = !!end   && date.getTime() === end.getTime();

      // Range highlight: use hover as preview end when end not yet set
      const rangeEnd = end ?? (start && hover && hover > start ? hover : null);
      const inRange  = !!(start && rangeEnd && date > start && date < rangeEnd);

      // Disable: past, or (if start selected) dates <= start
      const selectable = !past && !(start && !end && date <= start);

      result.push({ date, label: String(d), past, today: isToday,
                    isStart, isEnd, inRange, selectable });
    }

    return result;
  });

  ngOnInit(): void {}

  selectDay(date: Date): void {
    if (!this.startDate() || (this.startDate() && this.endDate())) {
      // Set new start, clear end
      this.startDate.set(date);
      this.endDate.set(null);
      this.rangeSelected.emit(null);
    } else {
      // Set end date
      this.endDate.set(date);
      this.hoverDate.set(null);
      this.rangeSelected.emit({ checkIn: toISO(this.startDate()!), checkOut: toISO(date) });
    }
  }

  clear(): void {
    this.startDate.set(null);
    this.endDate.set(null);
    this.hoverDate.set(null);
    this.rangeSelected.emit(null);
  }

  prevMonth(): void {
    if (this.viewMonth() === 0) {
      this.viewMonth.set(11);
      this.viewYear.update(y => y - 1);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.viewMonth() === 11) {
      this.viewMonth.set(0);
      this.viewYear.update(y => y + 1);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  formatDisplay(d: Date): string {
    return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
