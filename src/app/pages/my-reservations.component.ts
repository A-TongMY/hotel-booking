import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../api.service';
import { Reservation } from '../models';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [DecimalPipe, DatePipe, RouterLink],
  template: `
    <div class="page">
      <div class="container">

        <div class="page-header">
          <h1>My Bookings</h1>
          <a routerLink="/rooms" class="btn btn-accent">+ New booking</a>
        </div>

        @if (error()) { <div class="alert alert-error">{{ error() }}</div> }
        @if (loading()) { <div class="loading">Loading your reservations…</div> }

        @if (!loading() && !error()) {
          @if (reservations().length === 0) {
            <div class="empty-state card">
              <h3>No bookings yet</h3>
              <p>Search for available rooms and make your first reservation.</p>
              <a routerLink="/rooms" class="btn btn-primary" style="margin-top:1.25rem">
                Browse rooms
              </a>
            </div>
          } @else {
            <div class="res-list">
              @for (r of reservations(); track r.id) {
                <div class="res-card card">

                  <div class="res-left">
                    <div class="res-room-info">
                      <strong class="res-room-num">Room {{ r.roomNumber ?? '—' }}</strong>
                      @if (r.roomTypeName) {
                        <span class="res-type">{{ r.roomTypeName }}</span>
                      }
                    </div>

                    <div class="res-dates">
                      <div class="rdate">
                        <span class="rdate-lbl">Check-in</span>
                        <span class="rdate-val">{{ r.checkInDate | date:'EEE, d MMM y' }}</span>
                      </div>
                      <span class="rdate-arrow">→</span>
                      <div class="rdate">
                        <span class="rdate-lbl">Check-out</span>
                        <span class="rdate-val">{{ r.checkOutDate | date:'EEE, d MMM y' }}</span>
                      </div>
                    </div>

                    @if (r.notes) {
                      <p class="res-notes">{{ r.notes }}</p>
                    }
                  </div>

                  <div class="res-right">
                    <span class="badge badge-{{ statusClass(r.status) }}">{{ r.status }}</span>
                    <span class="res-total">RM {{ r.totalPrice | number:'1.0-0' }}</span>
                    <span class="res-guests">{{ r.numberOfGuests }} guest{{ r.numberOfGuests !== 1 ? 's' : '' }}</span>

                    @if (canCancel(r.status)) {
                      <button class="btn btn-outline btn-sm"
                              [disabled]="cancelling() === r.id"
                              (click)="cancel(r)">
                        {{ cancelling() === r.id ? 'Cancelling…' : 'Cancel booking' }}
                      </button>
                    }
                  </div>

                </div>
              }
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .res-list { display: flex; flex-direction: column; gap: 1rem; }

    .res-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .res-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: .65rem;
      min-width: 200px;
    }

    .res-room-info {
      .res-room-num { font-size: 1.05rem; display: block; }
      .res-type     { font-size: .82rem; color: var(--color-text-muted); }
    }

    .res-dates {
      display: flex;
      align-items: center;
      gap: .75rem;
      flex-wrap: wrap;
    }

    .rdate {
      .rdate-lbl { display: block; font-size: .68rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
      .rdate-val { font-weight: 500; font-size: .9rem; }
    }

    .rdate-arrow { color: var(--color-text-muted); font-size: 1.1rem; }

    .res-notes {
      font-size: .8125rem;
      color: var(--color-text-muted);
      font-style: italic;
      border-left: 2px solid var(--color-border);
      padding-left: .5rem;
    }

    .res-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: .5rem;
      flex-shrink: 0;
    }

    .res-total  { font-size: 1.1rem; font-weight: 700; }
    .res-guests { font-size: .8rem; color: var(--color-text-muted); }
  `],
})
export class MyReservationsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly reservations = signal<Reservation[]>([]);
  readonly loading      = signal(true);
  readonly error        = signal<string | null>(null);
  readonly cancelling   = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getMyReservations().subscribe({
      next:  list => { this.reservations.set(list); this.loading.set(false); },
      error: ()   => { this.error.set('Could not load your reservations.'); this.loading.set(false); },
    });
  }

  canCancel(status: string): boolean {
    return ['Pending', 'Confirmed'].includes(status);
  }

  cancel(r: Reservation): void {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    this.cancelling.set(r.id);
    this.api.cancelReservation(r.id).subscribe({
      next: updated => {
        this.reservations.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.cancelling.set(null);
      },
      error: () => {
        alert('Could not cancel this reservation. Please try again.');
        this.cancelling.set(null);
      },
    });
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
