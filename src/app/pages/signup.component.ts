import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pw  = group.get('password')?.value;
  const cpw = group.get('confirmPassword')?.value;
  return pw && cpw && pw !== cpw ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">

        <div class="auth-header">
          <div class="auth-logo">S</div>
          <h1>Create account</h1>
          <p>Join StayEase and start booking rooms</p>
        </div>

        @if (serverError()) {
          <div class="alert alert-error">{{ serverError() }}</div>
        }
        @if (success()) {
          <div class="alert alert-success">
            Account created! <a routerLink="/login">Sign in →</a>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="form-group">
            <label for="username">Username <span class="req">*</span></label>
            <input id="username"
                   formControlName="username"
                   placeholder="Choose a username (min. 3 chars)"
                   autocomplete="username"
                   [class.invalid]="isInvalid('username')" />
            @if (isInvalid('username')) {
              <span class="form-error">
                @if (f['username'].errors?.['required'])  { Username is required. }
                @else if (f['username'].errors?.['minlength']) { Minimum 3 characters required. }
                @else if (f['username'].errors?.['maxlength']) { Maximum 100 characters allowed. }
              </span>
            }
          </div>

          <div class="form-group">
            <label for="email">Email address <span class="req">*</span></label>
            <input id="email"
                   type="email"
                   formControlName="email"
                   placeholder="you@example.com"
                   autocomplete="email"
                   [class.invalid]="isInvalid('email')" />
            @if (isInvalid('email')) {
              <span class="form-error">
                @if (f['email'].errors?.['required']) { Email is required. }
                @else { Enter a valid email address. }
              </span>
            }
          </div>

          <div class="pw-row">
            <div class="form-group">
              <label for="password">Password <span class="req">*</span></label>
              <div class="input-wrap">
                <input id="password"
                       formControlName="password"
                       [type]="showPw() ? 'text' : 'password'"
                       placeholder="Min. 6 characters"
                       autocomplete="new-password"
                       [class.invalid]="isInvalid('password')" />
                <button type="button" class="toggle-pw"
                        (click)="toggleShowPw()">
                  {{ showPw() ? '🙈' : '👁' }}
                </button>
              </div>
              @if (isInvalid('password')) {
                <span class="form-error">
                  @if (f['password'].errors?.['required'])  { Password is required. }
                  @else if (f['password'].errors?.['minlength']) { Minimum 6 characters. }
                  @else if (f['password'].errors?.['maxlength']) { Maximum 100 characters. }
                </span>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm password <span class="req">*</span></label>
              <input id="confirmPassword"
                     formControlName="confirmPassword"
                     [type]="showPw() ? 'text' : 'password'"
                     placeholder="Repeat password"
                     autocomplete="new-password"
                     [class.invalid]="showConfirmError()" />
              @if (showConfirmError()) {
                <span class="form-error">Passwords do not match.</span>
              }
            </div>
          </div>

          <button type="submit"
                  class="btn btn-primary btn-full"
                  style="margin-top:.5rem"
                  [disabled]="form.invalid || loading() || success()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>

        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>

      </div>
    </div>
  `,
  styles: [`
    .pw-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 500px) {
      .pw-row { grid-template-columns: 1fr; }
    }
  `],
})
export class SignupComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  readonly loading     = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly success     = signal(false);
  readonly showPw      = signal(false);

  readonly form = this.fb.nonNullable.group({
    username:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email:           ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    password:        ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordsMatch });

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  toggleShowPw(): void {
    this.showPw.set(!this.showPw());
  }

  showConfirmError(): boolean {
    return !!(
      this.form.errors?.['passwordMismatch'] &&
      this.form.get('confirmPassword')?.touched
    );
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.serverError.set(null);

    const { username, email, password, confirmPassword } = this.form.getRawValue();
    const { error } = await this.auth.signup({ username, email, password });

    this.loading.set(false);
    if (error) { this.serverError.set(error); return; }
    this.success.set(true);
  }
}
