import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card card">

        <div class="auth-header">
          <div class="auth-logo">S</div>
          <h1>Welcome back</h1>
          <p>Sign in to your StayEase account</p>
        </div>

        @if (error()) {
          <div class="alert alert-error">{{ error() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">

          <div class="form-group">
            <label for="username">Username <span class="req">*</span></label>
            <input id="username"
                   formControlName="username"
                   placeholder="Enter your username"
                   autocomplete="username"
                   [class.invalid]="isInvalid('username')" />
            @if (isInvalid('username')) {
              <span class="form-error">
                @if (f['username'].errors?.['required'])  { Username is required. }
                @else if (f['username'].errors?.['minlength']) { Minimum 3 characters. }
                @else if (f['username'].errors?.['maxlength']) { Maximum 100 characters. }
              </span>
            }
          </div>

          <div class="form-group">
            <label for="password">Password <span class="req">*</span></label>
            <div class="input-wrap">
              <input id="password"
                     formControlName="password"
                     [type]="showPw() ? 'text' : 'password'"
                     placeholder="Enter your password"
                     autocomplete="current-password"
                     [class.invalid]="isInvalid('password')" />
              <button type="button" class="toggle-pw"
                      (click)="toggleShowPw()"
                      [attr.aria-label]="showPw() ? 'Hide password' : 'Show password'">
                {{ showPw() ? '🙈' : '👁' }}
              </button>
            </div>
            @if (isInvalid('password')) {
              <span class="form-error">
                @if (f['password'].errors?.['required'])  { Password is required. }
                @else if (f['password'].errors?.['minlength']) { Minimum 6 characters. }
              </span>
            }
          </div>

          <button type="submit"
                  class="btn btn-primary btn-full"
                  style="margin-top:.5rem"
                  [disabled]="form.invalid || loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>

        </form>

        <p class="auth-footer">
          No account yet? <a routerLink="/signup">Create one here</a>
        </p>

      </div>
    </div>
  `,
  styles: [],
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly showPw  = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
  });

  get f() { return this.form.controls; }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  toggleShowPw(): void {
    this.showPw.set(!this.showPw());
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.auth.login(this.form.getRawValue());
    this.loading.set(false);

    if (error) { this.error.set(error); return; }
    this.router.navigate([this.auth.isStaff() ? '/manage-reservations' : '/rooms']);
  }
}
