import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardSummaryResponse, DashboardBookingsResponse} from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe],
  template: `
    <div class="page">
      <div class="container">

        <div class="page-header">
          <div>
            <h1>Dashboard</h1>
            <p class="page-subtitle">Hotel operations overview</p>
          </div>

          <button class="btn btn-outline btn-sm"
                  type="button"
                  (click)="load()"
                  [disabled]="loading()">
            Refresh
          </button>
        </div>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        @if (loading()) {
          <div class="loading">Loading dashboard</div>
        } @else if (summary()) {
          <section class="metric-grid">
            <article class="card metric-card">
              <span>Total Rooms</span>
              <strong>{{ summary()!.totalRooms | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Available</span>
              <strong>{{ summary()!.availableRooms | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Occupied</span>
              <strong>{{ summary()!.occupiedRooms | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Maintenance</span>
              <strong>{{ summary()!.maintenanceRooms | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Today Check-ins</span>
              <strong>{{ summary()!.todayCheckIns | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Today Check-outs</span>
              <strong>{{ summary()!.todayCheckOuts | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Active Reservations</span>
              <strong>{{ summary()!.activeReservations | number }}</strong>
            </article>

            <article class="card metric-card">
              <span>Revenue This Month</span>
              <strong>{{ summary()!.revenueThisMonth | currency:'MYR':'symbol':'1.2-2' }}</strong>
            </article>
          </section>

          <section class="dashboard-grid">
            <article class="card panel">
              <div class="panel-header">
                <h2>Room Status</h2>
                <span>{{ occupancyRate() | number:'1.0-0' }}% occupied</span>
              </div>

              @if (roomStatusBreakdown().length) {
                <div class="bar-list">
                  @for (item of roomStatusBreakdown(); track item.status) {
                    <div class="bar-row">
                      <div class="bar-meta">
                        <span>{{ item.status || 'Unknown' | titlecase }}</span>
                        <strong>{{ item.count | number }}</strong>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" [style.width.%]="statusPercent(item.count)"></div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state compact">
                  <h3>No room status data</h3>
                  <p>Status breakdown will appear here once available.</p>
                </div>
              }
            </article>

            <article class="card panel">
              <div class="panel-header">
                <h2>Reservations</h2>
                <span>{{ summary()!.revenueTotal | currency:'MYR':'symbol':'1.2-2' }} total revenue</span>
              </div>

              <div class="reservation-summary">
                <div>
                  <span>Pending</span>
                  <strong>{{ summary()!.pendingReservations | number }}</strong>
                </div>
                <div>
                  <span>Confirmed</span>
                  <strong>{{ summary()!.confirmedReservations | number }}</strong>
                </div>
                <div>
                  <span>Active</span>
                  <strong>{{ summary()!.activeReservations | number }}</strong>
                </div>
              </div>
            </article>
          </section>

          <section class="card panel rooms-panel">
            <div class="panel-header">
              <h2>Rooms</h2>
              <span>{{ rooms().length | number }} rooms</span>
            </div>

            @if (rooms().length) {
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Room</th>
                      <th>Type</th>
                      <th>Floor</th>
                      <th>Status</th>
                      <th>Current Guest</th>
                      <th>Stay</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (room of rooms(); track room.roomId) {
                      <tr>
                        <td>{{ room.roomNumber || '-' }}</td>
                        <td>{{ room.roomType || '-' }}</td>
                        <td>{{ room.floor }}</td>
                        <td>
                          <span class="badge badge-{{ normalizeStatus(room.roomStatus) }}">
                            {{ room.roomStatus || 'Unknown' }}
                          </span>
                        </td>
                        <td>
                          @if (room.guestName) {
                            <div class="guest-cell">
                              <strong>{{ room.guestName }}</strong>
                              <span>{{ room.guestEmail }}</span>
                            </div>
                          } @else {
                            -
                          }
                        </td>
                        <td>
                          @if (room.checkInDate && room.checkOutDate) {
                            {{ room.checkInDate | date:'mediumDate' }} - {{ room.checkOutDate | date:'mediumDate' }}
                          } @else {
                            -
                          }
                        </td>
                        <td>{{ room.pricePerNight | currency:'MYR':'symbol':'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="empty-state compact">
                <h3>No rooms found</h3>
                <p>Room data will appear here once available.</p>
              </div>
            }
          </section>

          <section class="dashboard-grid">
            <article class="card panel">
              <div class="panel-header">
                <h2>Active Bookings</h2>
                <span>{{ activeBookings().length | number }}</span>
              </div>

              <ng-container [ngTemplateOutlet]="bookingTable"
                            [ngTemplateOutletContext]="{ rows: activeBookings() }" />
            </article>

            <article class="card panel">
              <div class="panel-header">
                <h2>Booking History</h2>
                <span>{{ bookingHistory().length | number }}</span>
              </div>

              <ng-container [ngTemplateOutlet]="bookingTable"
                            [ngTemplateOutletContext]="{ rows: bookingHistory() }" />
            </article>
          </section>

          <ng-template #bookingTable let-rows="rows">
            @if (rows.length) {
              <div class="booking-list">
                @for (booking of rows; track booking.id) {
                  <div class="booking-item">
                    <div>
                      <strong>Room {{ booking.roomNumber || '-' }}</strong>
                      <span>{{ booking.roomType || '-' }}</span>
                    </div>

                    <div>
                      <strong>{{ booking.guestName || '-' }}</strong>
                      <span>{{ booking.guestEmail || '-' }}</span>
                    </div>

                    <div>
                      <strong>{{ booking.totalPrice | currency:'MYR':'symbol':'1.2-2' }}</strong>
                      <span>{{ booking.nights }} night{{ booking.nights === 1 ? '' : 's' }}</span>
                    </div>

                    <div>
                      <span class="badge badge-{{ normalizeStatus(booking.status) }}">
                        {{ booking.status || 'Unknown' }}
                      </span>
                      <span>{{ booking.checkInDate | date:'mediumDate' }} - {{ booking.checkOutDate | date:'mediumDate' }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-state compact">
                <h3>No bookings found</h3>
                <p>Bookings will appear here once available.</p>
              </div>
            }
          </ng-template>
        }

      </div>
    </div>
  `,
  styles: [`
    .page-subtitle {
      margin-top: .25rem;
      color: var(--color-text-muted);
      font-size: .9rem;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .metric-card {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .35rem;
    }

    .metric-card span,
    .panel-header span,
    .reservation-summary span,
    .guest-cell span,
    .booking-item span {
      color: var(--color-text-muted);
      font-size: .8rem;
    }

    .metric-card strong {
      color: var(--color-primary);
      font-size: 1.45rem;
      line-height: 1.15;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .panel {
      padding: 1rem;
    }

    .panel-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .panel-header h2 {
      font-size: 1.15rem;
    }

    .bar-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .bar-meta {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: .35rem;
      font-size: .9rem;
    }

    .bar-track {
      height: 12px;
      border: 1px solid var(--color-border);
      border-radius: 99px;
      background: var(--color-surface);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      min-width: 4px;
      background: var(--color-accent);
      border-radius: inherit;
    }

    .reservation-summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .75rem;
    }

    .reservation-summary div {
      padding: 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      display: flex;
      flex-direction: column;
      gap: .25rem;
    }

    .reservation-summary strong {
      font-size: 1.35rem;
      color: var(--color-primary);
    }

    .rooms-panel {
      margin-bottom: 1rem;
    }

    .guest-cell {
      display: flex;
      flex-direction: column;
      gap: .15rem;
    }

    .booking-list {
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .booking-item {
      display: grid;
      grid-template-columns: 1fr 1.25fr .8fr 1.3fr;
      gap: .75rem;
      padding: .85rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
    }

    .booking-item > div {
      display: flex;
      flex-direction: column;
      gap: .15rem;
      min-width: 0;
    }

    .booking-item strong,
    .booking-item span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .compact {
      padding: 2rem 1rem;
    }

    @media (max-width: 900px) {
      .metric-grid,
      .dashboard-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .booking-item {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .metric-grid,
      .dashboard-grid,
      .reservation-summary,
      .booking-item {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly summary = signal<DashboardSummaryResponse | null>(null);
  readonly bookings = signal<DashboardBookingsResponse>({ active: [], history: [] });

  readonly roomStatusBreakdown = computed(() => this.summary()?.roomStatusBreakdown ?? []);
  readonly rooms = computed(() => this.summary()?.rooms ?? []);
  readonly activeBookings = computed(() => this.bookings().active ?? []);
  readonly bookingHistory = computed(() => this.bookings().history ?? []);

  readonly occupancyRate = computed(() => {
    const summary = this.summary();
    if (!summary?.totalRooms) return 0;
    return (summary.occupiedRooms / summary.totalRooms) * 100;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      summary: this.http.get<DashboardSummaryResponse>(`${this.base}/dashboard/summary`),
      bookings: this.http.get<DashboardBookingsResponse>(`${this.base}/dashboard/bookings`),
    }).subscribe({
      next: ({ summary, bookings }) => {
        this.summary.set(summary);
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err?.error?.message ?? err?.error ?? 'Unable to load dashboard data.');
        this.loading.set(false);
      },
    });
  }

  statusPercent(count: number): number {
    const max = Math.max(...this.roomStatusBreakdown().map(item => item.count), 1);
    return Math.max((count / max) * 100, count > 0 ? 6 : 0);
  }

  normalizeStatus(status: string | null): string {
    return (status ?? 'unknown').replace(/\s+/g, '').toLowerCase();
  }
}