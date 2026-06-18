// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  username: string;   // min 3, max 100
  password: string;   // min 6, max 100
}

export interface SignupRequest {
  username: string;        // min 3, max 100
  email: string;           // valid email
  password: string;        // min 6, max 100
}

export interface AuthResponse {
  token: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;   // 'guest' | 'staff' | 'admin' — decoded from JWT
}

// ── Rooms ─────────────────────────────────────────────────────────────────────
export interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: RoomType;
  pricePerNight: number;
  status: string;   // 'available' | 'occupied' | 'maintenance'
  floor: number;
  imageUrl?: string;
  amenities: string[];
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  maxAdults: number;
}

export interface CreateRoomRequest {
  roomNumber: string;
  roomTypeId: string;
  pricePerNight: number;
  floor: number;
  amenities: string[];
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  roomTypeId?: string;
  pricePerNight?: number;
  status?: string;
  floor?: number;
  amenities?: string[];
}

// ── Reservations ──────────────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  roomId: string;
  guestId: string;
  checkInDate: string;    // 'yyyy-MM-dd'
  checkOutDate: string;
  numberOfGuests: number;
  status: string;         // 'pending' | 'confirmed' | 'checkedIn' | 'checkedOut' | 'cancelled'
  totalPrice: number;
  notes?: string;
  createdAt: string;
  // joined fields
  roomNumber?: string;
  roomTypeName?: string;
  guestName?: string;
  guestEmail?: string;
}

export interface CreateReservationRequest {
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  notes?: string;
}

export interface UpdateReservationRequest {
  checkInDate?: string;
  checkOutDate?: string;
  status?: string;
  notes?: string;
}

// ── Guests ────────────────────────────────────────────────────────────────────
export interface Guest {
  id: string;
  authUserId: string;
  fullName: string;
  email: string;
  phone?: string;
  nationality?: string;
  icOrPassport?: string;
}

export interface UpdateGuestRequest {
  fullName?: string;
  phone?: string;
  nationality?: string;
  icOrPassport?: string;
}

// ── Date range ────────────────────────────────────────────────────────────────
export interface DateRange {
  checkIn: string;   // 'yyyy-MM-dd'
  checkOut: string;
}
