import { Component, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { CalendarComponent } from '../components/calendar.component';
import { Room, RoomType, DateRange } from '../models';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, FormsModule, CalendarComponent],
  template: `
    <div class="page">
      <div class="container">

        <div class="page-header">
          <div>
            <h1>Browse Rooms</h1>
            <p style="color:var(--color-text-muted);font-size:.9rem;margin-top:.2rem">
              Pick your dates, then search for available rooms
            </p>
          </div>
        </div>

        <!-- ── Search panel ─────────────────────────────────────────── -->
        <div class="search-panel card">
          <app-calendar (rangeSelected)="onRangeSelected($event)" />

          <div class="search-bar">
            <div class="form-group" style="margin-bottom:0;flex:1;min-width:180px">
              <label>Room type</label>
              <select [(ngModel)]="selectedTypeId">
                <option value="">All types</option>
                @for (t of roomTypes(); track t.id) {
                  <option [value]="t.id">{{ t.name }}</option>
                }
              </select>
            </div>

            <button class="btn btn-accent search-btn"
                    [disabled]="!dateRange() || searching()"
                    (click)="search()">
              @if (searching()) { Searching… } @else { Search rooms }
            </button>
          </div>

          @if (!dateRange()) {
            <p class="search-hint">⬆ Select check-in and check-out dates above to search.</p>
          }
        </div>

        <!-- ── Error ────────────────────────────────────────────────── -->
        @if (searchError()) {
          <div class="alert alert-error">{{ searchError() }}</div>
        }

        <!-- ── Results ──────────────────────────────────────────────── -->
        @if (searched()) {
          @if (rooms().length === 0) {
            <div class="empty-state card" style="margin-top:1.5rem">
              <h3>No rooms available</h3>
              <p>Try different dates or remove the room type filter.</p>
            </div>
          } @else {
            <p class="results-label">
              {{ rooms().length }} room{{ rooms().length !== 1 ? 's' : '' }} available
            </p>
            <div class="rooms-grid">
              @for (room of rooms(); track room.id) {
                <div class="room-card card">

                  <!-- Image / placeholder -->
                  <div class="room-img">
                    @if (room.imageUrl) {
                      <img [src]="room.imageUrl" [alt]="room.roomType?.name" loading="lazy" />
                    } @else {
                      <div class="room-img-placeholder">
                        {{ room.roomNumber }}
                      </div>
                    }
                    <span class="badge badge-{{ room.status?.toLowerCase() }} room-status-badge">
                      {{ room.status }}
                    </span>
                  </div>

                  <!-- Details -->
                  <div class="room-body">
                    <div class="room-title-row">
                      <h3>{{ room.roomType?.name ?? 'Room' }}</h3>
                      <span class="room-num">No. {{ room.roomNumber }}</span>
                    </div>
                    <p class="room-meta">Floor {{ room.floor }}
                      @if (room.roomType?.capacity) {
                        · Up to {{ room.roomType!.capacity }} guests
                      }
                    </p>

                    <div class="amenities">
                      @for (a of (room.amenities ?? []).slice(0, 4); track a) {
                        <span class="amenity-pill">{{ a }}</span>
                      }
                      @if ((room.amenities ?? []).length > 4) {
                        <span class="amenity-pill muted">
                          +{{ (room.amenities ?? []).length - 4 }} more
                        </span>
                      }
                    </div>

                    <div class="room-footer">
                      <div class="room-price">
                        <span class="price-amount">RM {{ room.pricePerNight | number:'1.0-0' }}</span>
                        <span class="price-night">/ night</span>
                      </div>
                      <button class="btn btn-accent btn-sm"
                              (click)="toggleBooking(room.id)">
                        {{ bookingRoomId() === room.id ? 'Close' : 'Book now' }}
                      </button>
                    </div>
                  </div>

                  <!-- ── Inline booking form ─────────────────────── -->
                  @if (bookingRoomId() === room.id) {
                    <div class="booking-panel">
                      <h4>Confirm your reservation</h4>

                      <div class="booking-dates-summary">
                        <div class="bds-item">
                          <span class="bds-label">Check-in</span>
                          <span class="bds-val">{{ dateRange()!.checkIn }}</span>
                        </div>
                        <span class="bds-arrow">→</span>
                        <div class="bds-item">
                          <span class="bds-label">Check-out</span>
                          <span class="bds-val">{{ dateRange()!.checkOut }}</span>
                        </div>
                        <span class="nights-chip">{{ nights() }} night{{ nights() !== 1 ? 's' : '' }}</span>
                      </div>

                      @if (bookError()) {
                        <div class="alert alert-error">{{ bookError() }}</div>
                      }
                      @if (bookSuccess()) {
                        <div class="alert alert-success">
                          ✓ Reservation confirmed! View it under <strong>My Bookings</strong>.
                        </div>
                      }

                      @if (!bookSuccess()) {
                        <form [formGroup]="bookForm" (ngSubmit)="submitBooking(room)">
                          <div class="book-form-row">
                            <div class="form-group" style="margin-bottom:0">
                              <label>Number of guests <span class="req">*</span></label>
                              <input type="number"
                                     formControlName="numberOfGuests"
                                     min="1"
                                     [attr.max]="room.roomType?.capacity ?? 10"
                                     [class.invalid]="bookInvalid('numberOfGuests')" />
                              @if (bookInvalid('numberOfGuests')) {
                                <span class="form-error">
                                  @if (bookForm.get('numberOfGuests')?.errors?.['required']) { Required. }
                                  @else if (bookForm.get('numberOfGuests')?.errors?.['min']) { Minimum 1 guest. }
                                  @else { Exceeds room capacity ({{ room.roomType?.capacity ?? 10 }}). }
                                </span>
                              }
                            </div>

                            <div class="total-estimate">
                              <span class="te-label">Estimated total</span>
                              <span class="te-amount">
                                RM {{ (room.pricePerNight * nights()) | number:'1.0-0' }}
                              </span>
                            </div>
                          </div>

                          <div class="form-group">
                            <label>Special requests (optional)</label>
                            <textarea formControlName="notes"
                                      rows="2"
                                      placeholder="e.g. early check-in, extra pillows, high floor…">
                            </textarea>
                          </div>

                          <div class="book-actions">
                            <button type="button" class="btn btn-ghost btn-sm"
                                    (click)="closeBooking()">Cancel</button>
                            <button type="submit" class="btn btn-primary"
                                    [disabled]="bookForm.invalid || booking()">
                              {{ booking() ? 'Confirming…' : 'Confirm reservation' }}
                            </button>
                          </div>
                        </form>
                      }
                    </div>
                  }

                </div>
              }
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    /* Search panel */
    .search-panel { padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }

    .search-bar {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .search-btn { flex-shrink: 0; padding: 0.6rem 1.5rem; }

    .search-hint {
      margin-top: 0.75rem;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      text-align: center;
    }

    .results-label {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }

    /* Rooms grid */
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 1.25rem;
      align-items: start;
    }

    .room-card { overflow: hidden; transition: box-shadow .2s, transform .15s; }
    .room-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

    /* Image */
    .room-img { position: relative; height: 148px; overflow: hidden; }
    .room-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .room-img-placeholder {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 2.5rem; color: #94a3b8;
    }
    .room-status-badge { position: absolute; top: .65rem; right: .65rem; }

    /* Body */
    .room-body { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: .6rem; }

    .room-title-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      h3 { font-size: 1rem; }
      .room-num { font-size: .78rem; color: var(--color-text-muted); margin-top: .15rem; }
    }

    .room-meta { font-size: .825rem; color: var(--color-text-muted); }

    .amenities { display: flex; flex-wrap: wrap; gap: .3rem; }
    .amenity-pill {
      padding: .15rem .5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 99px;
      font-size: .72rem;
      color: var(--color-text-muted);
      &.muted { font-style: italic; }
    }

    .room-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: .65rem;
      border-top: 1px solid var(--color-border);
    }

    .room-price {
      .price-amount { font-size: 1.15rem; font-weight: 600; }
      .price-night  { font-size: .78rem; color: var(--color-text-muted); margin-left: .2rem; }
    }

    /* Booking panel */
    .booking-panel {
      padding: 1.1rem 1.25rem;
      background: var(--color-surface);
      border-top: 2px solid var(--color-accent);

      h4 {
        font-family: var(--font-display);
        font-size: .95rem;
        margin-bottom: .9rem;
      }
    }

    .booking-dates-summary {
      display: flex;
      align-items: center;
      gap: .65rem;
      flex-wrap: wrap;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: .65rem .9rem;
      margin-bottom: .9rem;
    }

    .bds-item {
      .bds-label { display: block; font-size: .68rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
      .bds-val   { font-weight: 500; font-size: .875rem; }
    }

    .bds-arrow { color: var(--color-text-muted); }

    .nights-chip {
      margin-left: auto;
      background: var(--color-accent-soft);
      color: var(--color-accent);
      padding: .2rem .65rem;
      border-radius: 99px;
      font-size: .75rem;
      font-weight: 500;
    }

    .book-form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: .9rem;
      flex-wrap: wrap;

      .form-group { flex: 1; min-width: 130px; }
    }

    .total-estimate {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      flex-shrink: 0;

      .te-label  { font-size: .72rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .04em; }
      .te-amount { font-size: 1.2rem; font-weight: 700; color: var(--color-primary); }
    }

    .book-actions {
      display: flex;
      justify-content: flex-end;
      gap: .5rem;
      margin-top: .75rem;
    }
  `],
})
export class RoomsComponent {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  readonly rooms       = signal<Room[]>([]);
  readonly roomTypes   = signal<RoomType[]>([]);
  readonly dateRange   = signal<DateRange | null>(null);
  readonly searching   = signal(false);
  readonly searched    = signal(false);
  readonly searchError = signal<string | null>(null);

  readonly bookingRoomId = signal<string | null>(null);
  readonly booking       = signal(false);
  readonly bookError     = signal<string | null>(null);
  readonly bookSuccess   = signal(false);

  selectedTypeId = '';

  readonly nights = computed(() => {
    const r = this.dateRange();
    if (!r) return 0;
    return Math.round(
      (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86_400_000
    );
  });

  readonly bookForm = this.fb.nonNullable.group({
    numberOfGuests: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
    notes:          [''],
  });

  constructor() {
    this.api.getRoomTypes().subscribe({
      next:  types => this.roomTypes.set(types),
      error: ()    => { /* room types optional — don't block UI */ },
    });
  }

  onRangeSelected(range: { checkIn: string; checkOut: string } | null): void {
    this.dateRange.set(range);
    this.searched.set(false);
    this.rooms.set([]);
    this.closeBooking();
  }

  search(): void {
    const r = this.dateRange();
    if (!r) return;

    this.searching.set(true);
    this.searchError.set(null);
    this.closeBooking();

    this.api.getAvailableRooms(r.checkIn, r.checkOut, this.selectedTypeId || undefined)
      .subscribe({
        next:  rooms => { this.rooms.set(rooms); this.searching.set(false); this.searched.set(true); },
        error: ()    => { this.searchError.set('Could not load rooms.'); this.searching.set(false); },
      });
  }

  toggleBooking(roomId: string): void {
    if (this.bookingRoomId() === roomId) { this.closeBooking(); return; }
    this.bookingRoomId.set(roomId);
    this.bookError.set(null);
    this.bookSuccess.set(false);
    this.bookForm.reset({ numberOfGuests: 1, notes: '' });
  }

  closeBooking(): void {
    this.bookingRoomId.set(null);
    this.bookSuccess.set(false);
    this.bookError.set(null);
  }

  bookInvalid(field: string): boolean {
    const c = this.bookForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  submitBooking(room: Room): void {
    this.bookForm.markAllAsTouched();
    if (this.bookForm.invalid) return;

    const r = this.dateRange();
    if (!r) return;

    // Enforce capacity
    const maxGuests = room.roomType?.capacity ?? 20;
    const ng        = this.bookForm.get('numberOfGuests');
    if ((ng?.value ?? 0) > maxGuests) {
      ng?.setErrors({ max: true });
      return;
    }

    this.booking.set(true);
    this.bookError.set(null);

    const { numberOfGuests, notes } = this.bookForm.getRawValue();
    this.api.createReservation({
      roomId:       room.id,
      checkInDate:  r.checkIn,
      checkOutDate: r.checkOut,
      numberOfGuests,
      notes: notes.trim() || undefined,
    }).subscribe({
      next:  () => { this.bookSuccess.set(true); this.booking.set(false); },
      error: e  => {
        this.bookError.set(e?.error?.message ?? 'Booking failed. Please try again.');
        this.booking.set(false);
      },
    });
  }
}
