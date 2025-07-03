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

export interface SearchEntry {
  from: string;
  to: string;
  passengers: number;
}

export interface RecentSearchesProps {
  recentSearches: SearchEntry[];
}

export interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  rating: number;
}