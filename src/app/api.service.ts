import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  Room, RoomType, CreateRoomRequest, UpdateRoomRequest,
  Reservation, CreateReservationRequest, UpdateReservationRequest,
  Guest, UpdateGuestRequest,
  DashboardSummary, DashboardBookings,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  // ── Rooms ──────────────────────────────────────────────────────────────────
  getRooms(): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.base}/rooms`);
  }

  getRoom(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.base}/rooms/${id}`);
  }

  getAvailableRooms(checkIn: string, checkOut: string, roomTypeId?: string): Observable<Room[]> {
    let params = new HttpParams()
      .set('checkIn',  checkIn)
      .set('checkOut', checkOut);
    if (roomTypeId) params = params.set('roomTypeId', roomTypeId);
    return this.http.get<Room[]>(`${this.base}/rooms/available`, { params });
  }

  createRoom(req: CreateRoomRequest): Observable<Room> {
    return this.http.post<Room>(`${this.base}/rooms`, req);
  }

  updateRoom(id: string, req: UpdateRoomRequest): Observable<Room> {
    return this.http.put<Room>(`${this.base}/rooms/${id}`, req);
  }

  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/rooms/${id}`);
  }

  // ── Room types ─────────────────────────────────────────────────────────────
  getRoomTypes(): Observable<RoomType[]> {
    return this.http.get<RoomType[]>(`${this.base}/room-types`);
  }

  // ── Reservations ───────────────────────────────────────────────────────────
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.base}/reservations`);
  }

  getMyReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.base}/reservations/my`);
  }

  getReservation(id: string): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.base}/reservations/${id}`);
  }

  createReservation(req: CreateReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations`, req);
  }

  updateReservation(id: string, req: UpdateReservationRequest): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.base}/reservations/${id}`, req);
  }

  cancelReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.base}/reservations/${id}/cancel`, {});
  }

  checkIn(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.base}/reservations/${id}/check-in`, {});
  }

  checkOut(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.base}/reservations/${id}/check-out`, {});
  }

  // ── Guests ─────────────────────────────────────────────────────────────────
  getGuests(): Observable<Guest[]> {
    return this.http.get<Guest[]>(`${this.base}/guests`);
  }

  getGuest(id: string): Observable<Guest> {
    return this.http.get<Guest>(`${this.base}/guests/${id}`);
  }

  getMyProfile(): Observable<Guest> {
    return this.http.get<Guest>(`${this.base}/guests/me`);
  }

  updateMyProfile(req: UpdateGuestRequest): Observable<Guest> {
    return this.http.put<Guest>(`${this.base}/guests/me`, req);
  }
  
   // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/dashboard/summary`);
  }

  getDashboardBookings(): Observable<DashboardBookings> {
    return this.http.get<DashboardBookings>(`${this.base}/dashboard/bookings`);
  } 
}
