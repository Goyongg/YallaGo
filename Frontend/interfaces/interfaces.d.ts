// interfaces.d.ts - Updated with backend compatibility

export interface HomeUserData {
  id: string;
  name: string;
  role: string;
  ecoPoints: number;
  averageRating: number;
  gender: string;
}

export interface RideResultCardProps {
  departureTime: string;
  arrivalTime: string;
  duration: string;
  from: string;
  to: string;
  price: string;
  driverName: string;
  driverRating: number;
  driverImage?: string;
  availableSeats?: number;
  femaleOnly?: boolean;
  rideId?: string;
  // Vehicle information from backend
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehiclePlateNumber?: string;
}

export interface RecentSearch {
  from: string;
  to: string;
  passengers: number;
  date?: string;
  femaleOnly?: boolean;
  fromCoordinates?: {
    lat: number;
    lng: number;
  };
  toCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DriverUpcomingRideCardProps {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  from: string;
  to: string;
  price: string;
  availableSeats: number;
  status?: string; // optional status
}

export interface DriverHistoryRideCardProps {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
}

export interface RideSearchFormProps {
  femaleOnly: boolean;
  setFemaleOnly: (value: boolean) => void;
  passengerCount: string;
  setPassengerCount: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  userGender?: string;
}

export interface GreetingCardProps {
  userName: string;
  ecoPoints: number;
}

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  rating: number;
  userRole: string; // Added userRole to ProfileMenuProps
}

// Updated vehicle interfaces to match backend response
export interface Vehicle {
  vehicleId: string;
  driverId: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  seats: number;
}

export interface CreateVehicleDto {
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  seats: number;
}

export interface UpdateVehicleDto {
  color?: string;
}

// Updated backend response interfaces
export interface VehicleResponse {
  message: string;
  vehicleId?: string;
}

export interface MaxSeatsResponse {
  maxSeats: number;
}

// Backend ride interfaces
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Waypoint {
  coordinates: Coordinates;
  label: string;
}

export interface CreateRideDto {
  // From RidePlanDto
  startPoint: Coordinates;
  endPoint: Coordinates;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  
  // From CreateRideDto
  startLocation: string;
  endLocation: string;
  pricePerSeat: number;
  availableSeats: number;
  femaleOnly?: boolean;
  waypoints?: Waypoint[];
  comments?: string; // Backend expects 'comments' not 'comment'
}

export interface SearchRidesDto {
  startPoint: Coordinates;
  endPoint: Coordinates;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format - required by backend
  requestedSeats: number;
  femaleOnly?: boolean;
}

// Backend search response interface (enriched ride data)
export interface EnrichedRideResult {
  ride: {
    rideId: string;
    driverId: string;
    startLocation: string;
    endLocation: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    endGeo: {
      latitude: number;
      longitude: number;
    };
    departureTime: any; // Firestore Timestamp
    durationSeconds: number;
    distanceMeters: number;
    pricePerSeat: number;
    availableSeats: number;
    femaleOnly?: boolean;
    waypoints?: Waypoint[];
    vehicleId: string;
    status: string;
  };
  driver: {
    name: string;
    averageRating: number;
  } | null;
  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  } | null;
}

// Price recommendation interfaces
export interface RidePlanDto {
  startPoint: Coordinates;
  endPoint: Coordinates;
  date: string;
  time: string;
}

export interface PriceRecommendationResponse {
  recommendedPrice: number;
}

// Create ride passenger (booking) interfaces
export interface CreateRidePassengerDto {
  rideId: string;
  pickupPoint: string;
  startPoint: Coordinates;
  dropOffPoint: string;
  endPoint: Coordinates;
  seatsBooked: number;
}

export interface BookingResponse {
  message: string;
  bookingId: string;
}

// Review interfaces
export interface CreateReviewDto {
  rideId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  message: string;
  reviewId: string;
}

export interface Review {
  rating: number;
  comment?: string;
}

// Generic API response interface
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
}

// Error response interface
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

// Raw ride data from backend
export interface DriverRideResponse {
  rideId: string;
  startLocation: string;
  endLocation: string;
  departureTime: any; // Firestore Timestamp
  durationSeconds: number;
  pricePerSeat: number;
  availableSeats: number;
  totalSeats?: number; // Total seats in vehicle for calculating booked seats
  femaleOnly?: boolean;
  waypoints?: Waypoint[];
  comments?: string;
  status: 'in-progress' | 'departed' | 'completed' | 'cancelled';
  // Add these fields that might come from backend
  vehicleSeats?: number; // From vehicle data
  bookings?: Array<{
    passengerName: string;
    seatsBooked: number;
    phoneNumber: string;
  }>;
  // 🗺️ ADD: Coordinate fields that come from backend
  coordinates?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  endGeo?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  polyline?: string; // JSON string of coordinate array
}

// Processed ride data for frontend components
export interface ProcessedDriverRide {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  availableSeats: number;
  totalSeats?: number;
  bookedSeats: number; // Calculated: totalSeats - availableSeats
  hasBookings: boolean; // Whether ride has any passenger bookings
  status: string;
  date: string; // For grouping history (YYYY-MM-DD format)
  // Add coordinate fields for map display
  coordinates?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  endGeo?: {
    latitude?: number;
    longitude?: number;
    _latitude?: number; // Firestore format
    _longitude?: number; // Firestore format
  };
  polyline?: string; // JSON string of coordinate array
  bookings?: Array<{
    passengerName: string;
    phoneNumber: string;
    seatsBooked: number;
  }>;
}

// Driver rides hook return type
export interface UseDriverRidesReturn {
  rides: ProcessedDriverRide[];
  upcomingRides: ProcessedDriverRide[];
  historyRides: ProcessedDriverRide[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Updated ride actions hook return type
export interface UseRideActionsReturn {
  startRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  endRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  deleteRide: (rideId: string) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

// Ride status enum for frontend
export enum RideStatusFrontend {
  IN_PROGRESS = 'in-progress',
  DEPARTED = 'departed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Status display mapping
export const STATUS_DISPLAY_MAP = {
  'in-progress': 'Upcoming',
  'departed': 'Departed',
  'completed': 'Completed',
  'cancelled': 'Cancelled'
} as const;

// Add ride conflict check response
export interface RideConflictResponse {
  ok: boolean;
  message: string;
}

// Add eco points calculation response  
export interface EcoPointsResponse {
  ecoPoints: number;
}