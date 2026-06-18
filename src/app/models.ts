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

export type DashboardSummary = Record<string, any>;
export type DashboardBookings = any[] | Record<string, any>;

export interface DashboardMetric {
  label: string;
  value: number | string;
}

export interface RoomStatusCount {
  status: string | null;
  count: number;
}

export interface RoomWithCurrentBooking {
  roomId: string;
  roomNumber: string | null;
  roomType: string | null;
  pricePerNight: number;
  floor: number;
  roomStatus: string | null;
  reservationId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  bookingStatus: string | null;
}

export interface BookingHistoryEntry {
  id: string;
  roomNumber: string | null;
  roomType: string | null;
  guestName: string | null;
  guestEmail: string | null;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  status: string | null;
  totalPrice: number;
  notes: string | null;
  createdAt: string | null;
}

export interface DashboardSummaryResponse {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  pendingReservations: number;
  confirmedReservations: number;
  activeReservations: number;
  revenueThisMonth: number;
  revenueTotal: number;
  roomStatusBreakdown: RoomStatusCount[] | null;
  rooms: RoomWithCurrentBooking[] | null;
}

export interface DashboardBookingsResponse {
  active: BookingHistoryEntry[] | null;
  history: BookingHistoryEntry[] | null;
}