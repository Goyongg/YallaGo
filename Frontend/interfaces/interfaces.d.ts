// interfaces.d.ts - Updated with backend compatibility

export interface HomeUserData {
  id: string;
  name: string;
  role: string;
  ecoPoints: number;
  averageRating: number;
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