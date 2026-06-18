import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { Room, RoomType } from '../models';

type FormMode = 'add' | 'edit';

@Component({
  selector: 'app-manage-rooms',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="container">

        <div class="page-header">
          <h1>Manage Rooms</h1>
          <button class="btn btn-accent" (click)="openAdd()">+ Add room</button>
        </div>

        <!-- ── Add / Edit form ──────────────────────────────────────── -->
        @if (showForm()) {
          <div class="form-card card">
            <h3>{{ mode() === 'add' ? 'Add new room' : 'Edit room — ' + editingRoom()?.roomNumber }}</h3>

            @if (formError()) {
              <div class="alert alert-error">{{ formError() }}</div>
            }
            @if (formSuccess()) {
              <div class="alert alert-success">{{ formSuccess() }}</div>
            }

            <form [formGroup]="roomForm" (ngSubmit)="saveRoom()">
              <div class="grid-2">

                <div class="form-group">
                  <label>Room number <span class="req">*</span></label>
                  <input formControlName="roomNumber"
                         placeholder="e.g. 101"
                         [class.invalid]="fi('roomNumber')" />
                  @if (fi('roomNumber')) {
                    <span class="form-error">
                      @if (fc['roomNumber'].errors?.['required'])  { Room number is required. }
                      @else if (fc['roomNumber'].errors?.['maxlength']) { Max 10 characters. }
                    </span>
                  }
                </div>

                <div class="form-group">
                  <label>Room type <span class="req">*</span></label>
                  <select formControlName="roomTypeId" [class.invalid]="fi('roomTypeId')">
                    <option value="">Select room type…</option>
                    @for (t of roomTypes(); track t.id) {
                      <option [value]="t.id">{{ t.name }}</option>
                    }
                  </select>
                  @if (fi('roomTypeId')) {
                    <span class="form-error">Room type is required.</span>
                  }
                </div>

                <div class="form-group">
                  <label>Price per night (RM) <span class="req">*</span></label>
                  <input type="number"
                         formControlName="pricePerNight"
                         min="1" step="0.01"
                         placeholder="e.g. 280"
                         [class.invalid]="fi('pricePerNight')" />
                  @if (fi('pricePerNight')) {
                    <span class="form-error">
                      @if (fc['pricePerNight'].errors?.['required']) { Price is required. }
                      @else { Price must be at least RM 1. }
                    </span>
                  }
                </div>

                <div class="form-group">
                  <label>Floor <span class="req">*</span></label>
                  <input type="number"
                         formControlName="floor"
                         min="1"
                         placeholder="e.g. 2"
                         [class.invalid]="fi('floor')" />
                  @if (fi('floor')) {
                    <span class="form-error">
                      @if (fc['floor'].errors?.['required']) { Floor is required. }
                      @else { Floor must be at least 1. }
                    </span>
                  }
                </div>

                @if (mode() === 'edit') {
                  <div class="form-group">
                    <label>Status</label>
                    <select formControlName="status">
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                }

                <div class="form-group" [class.span-2]="mode() === 'add'">
                  <label>Amenities (comma-separated)</label>
                  <input formControlName="amenitiesRaw"
                         placeholder="WiFi, Air Conditioning, TV, Mini Bar" />
                  <span style="font-size:.75rem;color:var(--color-text-muted);margin-top:.2rem">
                    Separate each amenity with a comma.
                  </span>
                </div>

              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-ghost" (click)="closeForm()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="roomForm.invalid || saving()">
                  {{ saving() ? 'Saving…' : (mode() === 'add' ? 'Add room' : 'Save changes') }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- ── Rooms table ─────────────────────────────────────────── -->
        @if (loadError()) {
          <div class="alert alert-error">{{ loadError() }}</div>
        }

        @if (loading()) {
          <div class="loading">Loading rooms…</div>
        } @else if (rooms().length === 0 && !showForm()) {
          <div class="empty-state card">
            <h3>No rooms yet</h3>
            <p>Click "Add room" to create the first one.</p>
          </div>
        } @else if (rooms().length > 0) {
          <div class="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room No.</th>
                  <th>Type</th>
                  <th>Floor</th>
                  <th>Price / night</th>
                  <th>Amenities</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (room of rooms(); track room.id) {
                  <tr>
                    <td><strong>{{ room.roomNumber }}</strong></td>
                    <td>{{ room.roomType?.name ?? '—' }}</td>
                    <td>{{ room.floor }}</td>
                    <td>RM {{ room.pricePerNight | number:'1.0-0' }}</td>
                    <td>
                      <div class="amenity-list">
                        @for (a of (room.amenities ?? []).slice(0, 3); track a) {
                          <span class="amenity-chip">{{ a }}</span>
                        }
                        @if ((room.amenities ?? []).length > 3) {
                          <span class="amenity-chip muted">
                            +{{ (room.amenities ?? []).length - 3 }}
                          </span>
                        }
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-{{ room.status?.toLowerCase() }}">
                        {{ room.status }}
                      </span>
                    </td>
                    <td>
                      <div class="row-acts">
                        <button class="btn btn-outline btn-sm"
                                (click)="openEdit(room)">Edit</button>
                        <button class="btn btn-danger btn-sm"
                                [disabled]="deletingId() === room.id"
                                (click)="deleteRoom(room)">
                          {{ deletingId() === room.id ? '…' : 'Delete' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .form-card {
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      h3 { margin-bottom: 1.25rem; }
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.25rem;

      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }

    .span-2 { grid-column: 1 / -1; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: .75rem;
      padding-top: .75rem;
      border-top: 1px solid var(--color-border);
      margin-top: .5rem;
    }

    .amenity-list { display: flex; flex-wrap: wrap; gap: .25rem; }
    .amenity-chip {
      padding: .1rem .45rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 99px;
      font-size: .72rem;
      color: var(--color-text-muted);
      &.muted { font-style: italic; }
    }

    .row-acts { display: flex; gap: .4rem; }
  `],
})
export class ManageRoomsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  readonly rooms       = signal<Room[]>([]);
  readonly roomTypes   = signal<RoomType[]>([]);
  readonly loading     = signal(true);
  readonly loadError   = signal<string | null>(null);
  readonly showForm    = signal(false);
  readonly mode        = signal<FormMode>('add');
  readonly editingRoom = signal<Room | null>(null);
  readonly saving      = signal(false);
  readonly deletingId  = signal<string | null>(null);
  readonly formError   = signal<string | null>(null);
  readonly formSuccess = signal<string | null>(null);

  readonly roomForm = this.fb.nonNullable.group({
    roomNumber:   ['', [Validators.required, Validators.maxLength(10)]],
    roomTypeId:   ['', Validators.required],
    pricePerNight:[0,  [Validators.required, Validators.min(1)]],
    floor:        [1,  [Validators.required, Validators.min(1)]],
    status:       ['Available'],
    amenitiesRaw: [''],
  });

  get fc() { return this.roomForm.controls; }

  fi(field: string): boolean {
    const c = this.roomForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  ngOnInit(): void {
    this.loadRoomTypes();
    this.loadRooms();
  }

  private loadRoomTypes(): void {
    this.api.getRoomTypes().subscribe({
      next:  types => this.roomTypes.set(types),
      error: ()    => { /* non-fatal */ },
    });
  }

  private loadRooms(): void {
    this.loading.set(true);
    this.api.getRooms().subscribe({
      next:  rooms => { this.rooms.set(rooms); this.loading.set(false); },
      error: ()    => { this.loadError.set('Could not load rooms.'); this.loading.set(false); },
    });
  }

  openAdd(): void {
    this.mode.set('add');
    this.editingRoom.set(null);
    this.roomForm.reset({ roomNumber: '', roomTypeId: '', pricePerNight: 0, floor: 1, status: 'Available', amenitiesRaw: '' });
    this.formError.set(null);
    this.formSuccess.set(null);
    this.showForm.set(true);
  }

  openEdit(room: Room): void {
    this.mode.set('edit');
    this.editingRoom.set(room);
    this.roomForm.patchValue({
      roomNumber:    room.roomNumber,
      roomTypeId:    room.roomTypeId,
      pricePerNight: room.pricePerNight,
      floor:         room.floor,
      status:        room.status ?? 'Available',
      amenitiesRaw:  (room.amenities ?? []).join(', '),
    });
    this.formError.set(null);
    this.formSuccess.set(null);
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingRoom.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  saveRoom(): void {
    this.roomForm.markAllAsTouched();
    if (this.roomForm.invalid) return;

    this.saving.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    const { roomNumber, roomTypeId, pricePerNight, floor, status, amenitiesRaw } = this.roomForm.getRawValue();
    const amenities = amenitiesRaw
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    if (this.mode() === 'add') {
      this.api.createRoom({ roomNumber, roomTypeId, pricePerNight, floor, amenities })
        .subscribe({
          next: created => {
            // Reload to get joined roomType data
            this.loadRooms();
            this.formSuccess.set(`Room ${created.roomNumber} added successfully.`);
            this.saving.set(false);
            this.roomForm.reset({ roomNumber: '', roomTypeId: '', pricePerNight: 0, floor: 1, status: 'Available', amenitiesRaw: '' });
          },
          error: e => {
            this.formError.set(e?.error?.message ?? 'Failed to add room.');
            this.saving.set(false);
          },
        });
    } else {
      const id = this.editingRoom()!.id;
      this.api.updateRoom(id, { roomNumber, roomTypeId, pricePerNight, floor, status, amenities })
        .subscribe({
          next: updated => {
            this.rooms.update(list => list.map(r => r.id === updated.id ? { ...updated, roomType: r.roomType } : r));
            this.formSuccess.set(`Room ${updated.roomNumber} updated successfully.`);
            this.saving.set(false);
          },
          error: e => {
            this.formError.set(e?.error?.message ?? 'Failed to update room.');
            this.saving.set(false);
          },
        });
    }
  }

  deleteRoom(room: Room): void {
    if (!confirm(`Delete room ${room.roomNumber}? This cannot be undone.`)) return;

    this.deletingId.set(room.id);
    this.api.deleteRoom(room.id).subscribe({
      next:  () => {
        this.rooms.update(list => list.filter(r => r.id !== room.id));
        this.deletingId.set(null);
        if (this.editingRoom()?.id === room.id) this.closeForm();
      },
      error: () => {
        alert('Could not delete room. It may have active reservations.');
        this.deletingId.set(null);
      },
    });
  }
}
