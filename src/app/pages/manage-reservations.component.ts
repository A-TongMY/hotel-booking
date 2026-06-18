import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { Reservation } from '../models';

type StatusFilter = 'all' | 'Pending' | 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';

@Component({
  selector: 'app-manage-reservations',
  standalone: true,
  imports: [DecimalPipe, DatePipe, FormsModule],
  template: `
    <div class="page">
      <div class="container">

        <div class="page-header">
          <h1>All Reservations</h1>
          <span class="total-count">{{ reservations().length }} total</span>
        </div>

        <!-- ── Filter bar ─────────────────────────────────────────── -->
        <div class="filter-bar">
          @for (opt of statusOpts; track opt.value) {
            <button class="filter-btn"
                    [class.active]="activeFilter() === opt.value"
                    (click)="activeFilter.set(opt.value)">
              {{ opt.label }}
              <span class="fc">{{ countOf(opt.value) }}</span>
            </button>
          }
          <input class="search-box"
                 [(ngModel)]="searchQ"
                 placeholder="Search guest or room…" />
        </div>

        @if (loadError()) { <div class="alert alert-error">{{ loadError() }}</div> }
        @if (actionError()) { <div class="alert alert-error">{{ actionError() }}</div> }
        @if (loading()) { <div class="loading">Loading reservations…</div> }

        @if (!loading()) {
          @if (filtered().length === 0) {
            <div class="empty-state card">
              <p>No reservations match this filter.</p>
            </div>
          } @else {
            <div class="card table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Room</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Guests</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of filtered(); track r.id) {
                    <tr>
                      <td>
                        <span class="td-main">{{ r.guestName ?? '—' }}</span>
                        <span class="td-sub">{{ r.guestEmail }}</span>
                      </td>
                      <td>
                        <span class="td-main">{{ r.roomNumber ?? '—' }}</span>
                        <span class="td-sub">{{ r.roomTypeName }}</span>
                      </td>
                      <td>{{ r.checkInDate | date:'d MMM y' }}</td>
                      <td>{{ r.checkOutDate | date:'d MMM y' }}</td>
                      <td style="text-align:center">{{ r.numberOfGuests }}</td>
                      <td>RM {{ r.totalPrice | number:'1.0-0' }}</td>
                      <td>
                        <span class="badge badge-{{ statusClass(r.status) }}">
                          {{ r.status }}
                        </span>
                      </td>
                      <td>
                        <div class="row-acts">
                          @if (r.status === 'Pending') {
                            <button class="btn btn-primary btn-sm"
                                    [disabled]="busy() === r.id"
                                    (click)="confirm(r)">Confirm</button>
                          }
                          @if (r.status === 'Confirmed') {
                            <button class="btn btn-accent btn-sm"
                                    [disabled]="busy() === r.id"
                                    (click)="checkIn(r)">Check in</button>
                          }
                          @if (r.status === 'CheckedIn') {
                            <button class="btn btn-primary btn-sm"
                                    [disabled]="busy() === r.id"
                                    (click)="checkOut(r)">Check out</button>
                          }
                          @if (r.status === 'Pending' || r.status === 'Confirmed') {
                            <button class="btn btn-outline btn-sm"
                                    [disabled]="busy() === r.id"
                                    (click)="cancel(r)">Cancel</button>
                          }
                          @if (busy() === r.id) {
                            <span class="busy-indicator">…</span>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .total-count {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 99px;
      padding: .2rem .75rem;
      font-size: .8rem;
      color: var(--color-text-muted);
    }

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: .4rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      padding: .35rem .85rem;
      border: 1.5px solid var(--color-border);
      border-radius: 99px;
      background: var(--color-surface-2);
      font-size: .8rem;
      font-family: var(--font-body);
      cursor: pointer;
      transition: all .15s;

      &:hover  { border-color: var(--color-text-muted); }
      &.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    }

    .fc {
      background: rgba(0,0,0,.07);
      border-radius: 99px;
      padding: .05rem .4rem;
      font-size: .7rem;

      .filter-btn.active & { background: rgba(255,255,255,.2); }
    }

    .search-box {
      margin-left: auto;
      max-width: 210px;
      padding: .35rem .75rem;
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: .85rem;
      font-family: var(--font-body);
      &:focus { outline: none; border-color: var(--color-primary); }
    }

    /* Table helpers */
    .td-main { display: block; font-weight: 500; }
    .td-sub  { display: block; font-size: .75rem; color: var(--color-text-muted); }

    .row-acts { display: flex; gap: .35rem; flex-wrap: nowrap; align-items: center; }

    .busy-indicator { color: var(--color-text-muted); font-size: .85rem; }
  `],
})
export class ManageReservationsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly reservations = signal<Reservation[]>([]);
  readonly loading      = signal(true);
  readonly loadError    = signal<string | null>(null);
  readonly actionError  = signal<string | null>(null);
  readonly activeFilter = signal<StatusFilter>('all');
  readonly busy         = signal<string | null>(null);

  searchQ = '';

  readonly statusOpts: { value: StatusFilter; label: string }[] = [
    { value: 'all',        label: 'All'        },
    { value: 'Pending',    label: 'Pending'    },
    { value: 'Confirmed',  label: 'Confirmed'  },
    { value: 'CheckedIn',  label: 'Checked in' },
    { value: 'CheckedOut', label: 'Checked out'},
    { value: 'Cancelled',  label: 'Cancelled'  },
  ];

  readonly filtered = computed(() => {
    let list = this.reservations();
    const f  = this.activeFilter();
    const q  = this.searchQ.toLowerCase().trim();

    if (f !== 'all') list = list.filter(r => r.status === f);
    if (q) list = list.filter(r =>
      r.guestName?.toLowerCase().includes(q)  ||
      r.guestEmail?.toLowerCase().includes(q) ||
      r.roomNumber?.toLowerCase().includes(q)
    );
    return list;
  });

  countOf(status: StatusFilter): number {
    if (status === 'all') return this.reservations().length;
    return this.reservations().filter(r => r.status === status).length;
  }

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.api.getAllReservations().subscribe({
      next:  list => { this.reservations.set(list); this.loading.set(false); },
      error: ()   => { this.loadError.set('Could not load reservations.'); this.loading.set(false); },
    });
  }

  private patch(updated: Reservation): void {
    this.reservations.update(list => list.map(r => r.id === updated.id ? updated : r));
  }

  private run(id: string, obs: ReturnType<ApiService['checkIn']>): void {
    this.busy.set(id);
    this.actionError.set(null);
    obs.subscribe({
      next:  updated => { this.patch(updated); this.busy.set(null); },
      error: e => {
        this.actionError.set(e?.error?.message ?? 'Action failed. Please try again.');
        this.busy.set(null);
      },
    });
  }

  confirm(r: Reservation): void  { this.run(r.id, this.api.updateReservation(r.id, { status: 'Confirmed' })); }
  checkIn(r: Reservation): void  { this.run(r.id, this.api.checkIn(r.id)); }
  checkOut(r: Reservation): void { this.run(r.id, this.api.checkOut(r.id)); }
  cancel(r: Reservation): void   {
    if (!confirm(`Cancel reservation for ${r.guestName ?? 'this guest'}?`)) return;
    this.run(r.id, this.api.cancelReservation(r.id));
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      'Pending':    'pending',
      'Confirmed':  'confirmed',
      'CheckedIn':  'checkedin',
      'CheckedOut': 'checkedout',
      'Cancelled':  'cancelled',
    };
    return map[s] ?? 'pending';
  }
}
