import { Routes } from '@angular/router';
import { authGuard, publicGuard, staffGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login',  loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent),  canActivate: [publicGuard] },
  { path: 'signup', loadComponent: () => import('./pages/signup.component').then(m => m.SignupComponent), canActivate: [publicGuard] },

  { path: 'rooms',              loadComponent: () => import('./pages/rooms.component').then(m => m.RoomsComponent),             canActivate: [authGuard] },
  { path: 'my-reservations',    loadComponent: () => import('./pages/my-reservations.component').then(m => m.MyReservationsComponent), canActivate: [authGuard] },
  { path: 'profile',            loadComponent: () => import('./pages/profile.component').then(m => m.ProfileComponent),          canActivate: [authGuard] },

  { path: 'manage-reservations', loadComponent: () => import('./pages/manage-reservations.component').then(m => m.ManageReservationsComponent), canActivate: [authGuard, staffGuard] },
  { path: 'manage-rooms',        loadComponent: () => import('./pages/manage-rooms.component').then(m => m.ManageRoomsComponent),             canActivate: [authGuard, staffGuard] },

  { path: '', redirectTo: 'rooms', pathMatch: 'full' },
  { path: '**', redirectTo: 'rooms' },
];
