import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="nav-inner">

        <a [routerLink]="auth.isStaff() ? '/dashboard' : '/rooms'" class="nav-brand">
          <span class="nav-brand-mark">S</span>StayEase
          </a>

        <nav class="nav-links">
          @if (auth.isLoggedIn()) {
            <!-- All logged-in users -->
            <a routerLink="/rooms" routerLinkActive="active">Rooms</a>

            @if (!auth.isStaff()) {
              <!-- Guest only -->
              <a routerLink="/my-reservations" routerLinkActive="active">My Bookings</a>
              <a routerLink="/profile" routerLinkActive="active">Profile</a>
            }

            @if (auth.isStaff()) {
              <!-- Staff only -->
              <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
              <a routerLink="/manage-reservations" routerLinkActive="active">Reservations</a>
              <a routerLink="/manage-rooms" routerLinkActive="active">Manage Rooms</a>
            }
          }
        </nav>

        <div class="nav-actions">
          @if (auth.isLoggedIn()) {
            <div class="nav-user">
              <span class="nav-username">{{ auth.user()?.username }}</span>
              <span class="nav-role badge badge-{{ auth.user()?.role?.toLowerCase() }}">
                {{ auth.user()?.role }}
              </span>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Sign out</button>
          } @else {
            <a routerLink="/login"  class="btn btn-ghost btn-sm">Sign in</a>
            <a routerLink="/signup" class="btn btn-primary btn-sm">Sign up</a>
          }
        </div>

      </div>
    </header>
  `,
  styles: [`
    .navbar {
      position: sticky; top: 0; z-index: 100;
      height: 60px;
      background: var(--color-surface-2);
      border-bottom: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .nav-inner {
      max-width: 1100px; margin: 0 auto;
      padding: 0 1.5rem;
      height: 100%;
      display: flex; align-items: center; gap: 2rem;
    }

    .nav-brand {
      display: flex; align-items: center; gap: 0.5rem;
      font-family: var(--font-display); font-size: 1.1rem; font-weight: 500;
      color: var(--color-primary); text-decoration: none; flex-shrink: 0;
    }

    .nav-brand-mark {
      width: 26px; height: 26px;
      background: var(--color-primary); color: #fff;
      border-radius: 6px; display: inline-flex;
      align-items: center; justify-content: center; font-size: 0.85rem;
    }

    .nav-links {
      display: flex; align-items: center; gap: 0.1rem; flex: 1;

      a {
        padding: 0.35rem 0.7rem;
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        color: var(--color-text-muted);
        text-decoration: none;
        transition: color 0.15s, background 0.15s;
        &:hover  { color: var(--color-text); background: var(--color-surface); }
        &.active { color: var(--color-primary); font-weight: 500; }
      }
    }

    .nav-actions {
      display: flex; align-items: center; gap: 0.75rem; margin-left: auto;
    }

    .nav-user {
      display: flex; align-items: center; gap: 0.5rem;
    }

    .nav-username {
      font-size: 0.85rem; color: var(--color-text-muted);
      max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }

    .nav-role { font-size: 0.7rem; }
  `],
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
}
