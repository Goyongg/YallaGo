// interfaces.d.ts

export interface RideSearchFormProps {
  femaleOnly: boolean;
  setFemaleOnly: (value: boolean) => void;
  passengerCount: string;
  setPassengerCount: (value: string) => void;
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