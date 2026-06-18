import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth/auth.service';
import { Guest } from '../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="container" style="max-width:620px">

        <div class="page-header">
          <h1>My Profile</h1>
        </div>

        <!-- Account summary -->
        <div class="account-card card">
          <div class="account-inner">
            <div class="avatar-circle">
              {{ auth.user()?.username?.charAt(0)?.toUpperCase() ?? '?' }}
            </div>
            <div class="account-info">
              <strong class="account-name">{{ auth.user()?.username }}</strong>
              <span class="badge badge-{{ auth.user()?.role?.toLowerCase() }}" style="margin-left:.5rem">
                {{ auth.user()?.role }}
              </span>
              <p class="account-email">{{ auth.user()?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Guest profile form -->
        <div class="card profile-form-card">
          <h3>Guest information</h3>
          <p class="form-sub">This information is used when making reservations.</p>

          @if (loadError())  { <div class="alert alert-error">{{ loadError() }}</div> }
          @if (saveError())  { <div class="alert alert-error">{{ saveError() }}</div> }
          @if (saveSuccess()){ <div class="alert alert-success">Profile updated successfully ✓</div> }

          @if (loading()) {
            <div class="loading">Loading profile…</div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()">

              <div class="profile-grid">
                <div class="form-group">
                  <label>Full name <span class="req">*</span></label>
                  <input formControlName="fullName"
                         placeholder="Ahmad bin Ibrahim"
                         [class.invalid]="fi('fullName')" />
                  @if (fi('fullName')) {
                    <span class="form-error">Full name is required.</span>
                  }
                </div>

                <div class="form-group">
                  <label>Phone number</label>
                  <input formControlName="phone"
                         placeholder="+60 12-345 6789"
                         type="tel" />
                </div>

                <div class="form-group">
                  <label>Nationality</label>
                  <input formControlName="nationality"
                         placeholder="e.g. Malaysian" />
                </div>

                <div class="form-group">
                  <label>IC / Passport no.</label>
                  <input formControlName="icOrPassport"
                         placeholder="e.g. 990101-14-1234" />
                </div>
              </div>

              <div class="profile-actions">
                <button type="button" class="btn btn-ghost"
                        (click)="resetForm()"
                        [disabled]="form.pristine">
                  Discard changes
                </button>
                <button type="submit" class="btn btn-primary"
                        [disabled]="form.invalid || form.pristine || saving()">
                  {{ saving() ? 'Saving…' : 'Save profile' }}
                </button>
              </div>

            </form>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .account-card { padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }

    .account-inner { display: flex; align-items: center; gap: 1.1rem; }

    .avatar-circle {
      width: 52px; height: 52px;
      border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; font-weight: 600; flex-shrink: 0;
    }

    .account-name  { font-size: 1.05rem; }
    .account-email { font-size: .85rem; color: var(--color-text-muted); margin-top: .2rem; }

    .profile-form-card {
      padding: 1.5rem;
      h3 { margin-bottom: .25rem; }
    }

    .form-sub { font-size: .85rem; color: var(--color-text-muted); margin-bottom: 1.25rem; }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 1.25rem;

      @media (max-width: 500px) { grid-template-columns: 1fr; }
    }

    .profile-actions {
      display: flex;
      justify-content: flex-end;
      gap: .75rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      margin-top: .5rem;
    }
  `],
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly fb  = inject(FormBuilder);

  private originalValues: Partial<Guest> = {};

  readonly loading     = signal(true);
  readonly saving      = signal(false);
  readonly loadError   = signal<string | null>(null);
  readonly saveError   = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName:     ['', Validators.required],
    phone:        [''],
    nationality:  [''],
    icOrPassport: [''],
  });

  fi(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  ngOnInit(): void {
    this.api.getMyProfile().subscribe({
      next: g => {
        this.originalValues = g;
        this.form.patchValue({
          fullName:     g.fullName     ?? '',
          phone:        g.phone        ?? '',
          nationality:  g.nationality  ?? '',
          icOrPassport: g.icOrPassport ?? '',
        });
        this.form.markAsPristine();
        this.loading.set(false);
      },
      error: () => {
        // Profile may not exist yet — that's OK, let the user fill it in
        this.loading.set(false);
      },
    });
  }

  resetForm(): void {
    this.form.patchValue({
      fullName:     (this.originalValues as Guest).fullName     ?? '',
      phone:        (this.originalValues as Guest).phone        ?? '',
      nationality:  (this.originalValues as Guest).nationality  ?? '',
      icOrPassport: (this.originalValues as Guest).icOrPassport ?? '',
    });
    this.form.markAsPristine();
    this.saveSuccess.set(false);
    this.saveError.set(null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const val = this.form.getRawValue();
    this.api.updateMyProfile({
      fullName:     val.fullName     || undefined,
      phone:        val.phone        || undefined,
      nationality:  val.nationality  || undefined,
      icOrPassport: val.icOrPassport || undefined,
    }).subscribe({
      next: updated => {
        this.originalValues = updated;
        this.form.markAsPristine();
        this.saveSuccess.set(true);
        this.saving.set(false);
      },
      error: e => {
        this.saveError.set(e?.error?.message ?? 'Could not save profile. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
