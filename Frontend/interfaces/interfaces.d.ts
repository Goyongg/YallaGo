// interfaces.d.ts

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
}