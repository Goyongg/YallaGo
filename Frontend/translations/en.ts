// (auth)
import greeting from '../locales/en/(auth)/onboarding/greeting.json';
import nameContact from '../locales/en/(auth)/onboarding/name-contact.json';
import password from '../locales/en/(auth)/onboarding/password.json';
import role from '../locales/en/(auth)/onboarding/role.json';
import emergency from '../locales/en/(auth)/onboarding/emergency.json';
import driverLicense from '../locales/en/(auth)/onboarding/driver-license.json';
import login from '../locales/en/(auth)/login.json';

// (modals)
import locationPicker from '../locales/en/(modals)/location-picker.json';

// (tabs)
import Home from '../locales/en/(tabs)/home.json';
import SearchResultsScreen from '../locales/en/(tabs)/SearchResultsScreen.json';
import RideDetailsScreen from '../locales/en/(tabs)/RideDetailsScreen.json';
import RideDetails from '../locales/en/(tabs)/rideDetails.json';
import driverRideDetails from '../locales/en/(tabs)/driverRideDetails.json';
import bookingDetails from '../locales/en/(tabs)/bookingDetails.json';

// components
import BookingHistoryCard from '../locales/en/components/BookingHistoryCard.json';
import UpcomingBookingCard from '../locales/en/components/UpcomingBookingCard.json';
import DriverRideHistoryCard from '../locales/en/components/DriverRideHistoryCard.json';
import DriverUpcomingRideCard from '../locales/en/components/DriverUpcomingRideCard.json';
import RideResultCard from '../locales/en/components/RideResultCard.json';
import UpcomingRideCard from '../locales/en/components/UpcomingRideCard.json';
import ProfileMenu from '../locales/en/components/ProfileMenu.json';
import CreateRideForm from '../locales/en/components/CreateRideForm.json';
import RideSearchForm from '../locales/en/components/RideSearchForm.json';
import RecentSearches from '../locales/en/components/RecentSearches.json';
import GreetingCard from '../locales/en/components/GreetingCard.json';
import DateTimePickerModal from '../locales/en/components/DateTimePickerModal.json';
import DatePickerModal from '../locales/en/components/DatePickerModal.json';
import SOSButton from '../locales/en/components/SOSButton.json';
import ReviewModal from '../locales/en/components/ReviewModal.json';

// profile
import BookingDashboard from '../locales/en/profile/BookingDashboard.json';
import BookingRequests from '../locales/en/profile/BookingRequests.json';
import DriverDashboard from '../locales/en/profile/DriverDashboard.json';
import gifts from '../locales/en/profile/gifts.json';
import info from '../locales/en/profile/info.json';
import manage from '../locales/en/profile/manage.json'
import safety from '../locales/en/profile/safety.json';
import settings from '../locales/en/profile/settings.json';
import vehicles from '../locales/en/profile/vehicles.json';

export default {
  // (auth)
  '(auth)/onboarding/greeting': greeting,
  '(auth)/onboarding/name-contact': nameContact,
  '(auth)/onboarding/password': password,
  '(auth)/onboarding/role': role,
  '(auth)/onboarding/emergency': emergency,
  '(auth)/onboarding/driver-license': driverLicense,
  '(auth)/login': login,

  // (modals)
  '(modals)/location-picker': locationPicker,

  // (tabs)
  '(tabs)/home': Home,
  '(tabs)/SearchResultsScreen': SearchResultsScreen,
  '(tabs)/RideDetailsScreen': RideDetailsScreen,
  '(tabs)/ride-details': RideDetails,
  '(tabs)/driverRideDetails': driverRideDetails,
  '(tabs)/bookingDetails': bookingDetails,

  // components
  'components/BookingHistoryCard': BookingHistoryCard,
  'components/UpcomingBookingCard': UpcomingBookingCard,
  'components/DriverRideHistoryCard': DriverRideHistoryCard,
  'components/DriverUpcomingRideCard': DriverUpcomingRideCard,
  'components/RideResultCard': RideResultCard,
  'components/UpcomingRideCard': UpcomingRideCard,
  'components/ProfileMenu': ProfileMenu,
  'components/CreateRideForm': CreateRideForm,
  'components/RideSearchForm': RideSearchForm,
  'components/RecentSearches': RecentSearches,
  'components/GreetingCard': GreetingCard,
  'components/DateTimePickerModal': DateTimePickerModal,
  'components/DatePickerModal': DatePickerModal,
  'components/SOSButton': SOSButton,
  'components/ReviewModal': ReviewModal,

  // profile
  'profile/BookingDashboard': BookingDashboard,
  'profile/BookingRequests': BookingRequests,
  'profile/DriverDashboard': DriverDashboard,
  'profile/gifts': gifts,
  'profile/info': info,
  'profile/manage': manage,
  'profile/safety': safety,
  'profile/settings': settings,
  'profile/vehicles': vehicles,
};
