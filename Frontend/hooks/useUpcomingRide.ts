// hooks/useUpcomingRide.ts
import { useEffect, useState } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { Platform } from 'react-native';

// This should be checked to match the current IP address
const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

interface UpcomingRideData {
  rideId: string;
  departureTime: string;
  from: string;
  to: string;
  userRole: 'driver' | 'passenger';
  vehicle?: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };
  passengerCount?: number;
}

const useUpcomingRide = (userRole: string) => {
  const [upcomingRide, setUpcomingRide] = useState<UpcomingRideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingRide = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = auth().currentUser;
        if (!user || !userRole) {
          setLoading(false);
          return;
        }

        const idToken = await user.getIdToken();

        console.log('Fetching upcoming ride for user role:', userRole);

        if (userRole === 'driver') {
          // For drivers: Get upcoming rides and find the next one
          const ridesResponse = await axios.get(`${BASE_URL}/rides`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          const rides = ridesResponse.data;
          console.log('Driver rides response:', rides);
          
          // Filter for rides that are in-progress and in the future
          const now = new Date();
          console.log('Current time:', now.toISOString());
          
          const upcomingRides = rides.filter((ride: any) => {
            // Handle both Firestore timestamp format and regular timestamp
            let departureTime: Date;
            
            try {
              if (ride.departureTime && typeof ride.departureTime === 'object') {
                // Handle Firestore timestamp with _seconds property
                if (ride.departureTime._seconds) {
                  departureTime = new Date(ride.departureTime._seconds * 1000);
                } else if (ride.departureTime.seconds) {
                  departureTime = new Date(ride.departureTime.seconds * 1000);
                } else {
                  console.log('Unknown timestamp format for ride:', ride.rideId, ride.departureTime);
                  return false;
                }
              } else if (ride.departureTime) {
                // Regular timestamp or string
                departureTime = new Date(ride.departureTime);
              } else {
                console.log('No departure time for ride:', ride.rideId);
                return false;
              }
              
              // Validate the date
              if (isNaN(departureTime.getTime())) {
                console.log('Invalid date for ride:', ride.rideId, departureTime);
                return false;
              }
              
            } catch (error) {
              console.log('Error parsing departure time for ride:', ride.rideId, error);
              return false;
            }
            
            console.log(`Ride ${ride.rideId}: status=${ride.status}, departureTime=${departureTime.toISOString()}, isInFuture=${departureTime > now}`);
            
            return (
              ride.status === 'in-progress' && 
              departureTime > now
            );
          });

          console.log('Filtered upcoming rides:', upcomingRides.length);

          if (upcomingRides.length > 0) {
            // Sort by departure time and get the next one
            upcomingRides.sort((a: any, b: any) => {
              const getTime = (ride: any) => {
                try {
                  if (ride.departureTime && typeof ride.departureTime === 'object') {
                    if (ride.departureTime._seconds) {
                      return ride.departureTime._seconds * 1000;
                    } else if (ride.departureTime.seconds) {
                      return ride.departureTime.seconds * 1000;
                    }
                  }
                  return new Date(ride.departureTime).getTime();
                } catch (error) {
                  console.log('Error getting time for sorting:', ride.rideId, error);
                  return 0;
                }
              };
              
              return getTime(a) - getTime(b);
            });

            const nextRide = upcomingRides[0];
            console.log('Next upcoming ride:', nextRide);
            
            // Calculate passenger count based on booked seats
            // Total seats - available seats = booked seats
            const bookedSeats = (nextRide.seats || 4) - (nextRide.availableSeats || 0);
            const passengerCount = Math.max(0, bookedSeats);

            let departureTimeISO: string;
            try {
              if (nextRide.departureTime && typeof nextRide.departureTime === 'object') {
                if (nextRide.departureTime._seconds) {
                  departureTimeISO = new Date(nextRide.departureTime._seconds * 1000).toISOString();
                } else if (nextRide.departureTime.seconds) {
                  departureTimeISO = new Date(nextRide.departureTime.seconds * 1000).toISOString();
                } else {
                  departureTimeISO = new Date(nextRide.departureTime).toISOString();
                }
              } else {
                departureTimeISO = new Date(nextRide.departureTime).toISOString();
              }
            } catch (error) {
              console.log('Error converting departure time to ISO:', error);
              departureTimeISO = new Date().toISOString(); // Fallback to current time
            }

            const upcomingRideData: UpcomingRideData = {
              rideId: nextRide.rideId,
              departureTime: departureTimeISO,
              from: nextRide.startLocation,
              to: nextRide.endLocation,
              userRole: 'driver',
              passengerCount: Math.max(1, passengerCount), // Show at least 1 if no actual bookings yet
            };

            console.log('Setting upcoming ride data:', upcomingRideData);
            setUpcomingRide(upcomingRideData);
          } else {
            console.log('No upcoming rides found for driver');
            setUpcomingRide(null);
          }

        } else if (userRole === 'passenger') {
          // For passengers: Get bookings and find the next upcoming one
          const bookingsResponse = await axios.get(`${BASE_URL}/bookings`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });

          const bookings = bookingsResponse.data;
          console.log('Passenger bookings response:', bookings);
          
          // Filter for upcoming bookings
          const now = new Date();
          const upcomingBookings = bookings.filter((booking: any) => {
            let departureTime: Date;
            
            try {
              if (booking.date && typeof booking.date === 'object') {
                if (booking.date._seconds) {
                  departureTime = new Date(booking.date._seconds * 1000);
                } else if (booking.date.seconds) {
                  departureTime = new Date(booking.date.seconds * 1000);
                } else {
                  console.log('Unknown booking date format:', booking.bookingId, booking.date);
                  return false;
                }
              } else if (booking.date) {
                departureTime = new Date(booking.date);
              } else {
                console.log('No date for booking:', booking.bookingId);
                return false;
              }
              
              if (isNaN(departureTime.getTime())) {
                console.log('Invalid date for booking:', booking.bookingId, departureTime);
                return false;
              }
              
            } catch (error) {
              console.log('Error parsing booking date:', booking.bookingId, error);
              return false;
            }
            
            return (
              ['pending', 'confirmed', 'ongoing'].includes(booking.status) &&
              departureTime > now
            );
          });

          console.log('Filtered upcoming bookings:', upcomingBookings.length);

          if (upcomingBookings.length > 0) {
            // Sort by departure time and get the next one
            upcomingBookings.sort((a: any, b: any) => {
              const getTime = (booking: any) => {
                try {
                  if (booking.date && typeof booking.date === 'object') {
                    if (booking.date._seconds) {
                      return booking.date._seconds * 1000;
                    } else if (booking.date.seconds) {
                      return booking.date.seconds * 1000;
                    }
                  }
                  return new Date(booking.date).getTime();
                } catch (error) {
                  console.log('Error getting booking time for sorting:', booking.bookingId, error);
                  return 0;
                }
              };
              
              return getTime(a) - getTime(b);
            });

            const nextBooking = upcomingBookings[0];
            console.log('Next upcoming booking:', nextBooking);

            // For passengers, we need vehicle data but don't have direct access
            // Using placeholder data that would normally come from the backend
            const vehiclePlaceholder = {
              make: 'Toyota',
              model: 'Camry',
              color: 'White',
              plateNumber: 'ABC123',
            };

            let departureTimeISO: string;
            try {
              if (nextBooking.date && typeof nextBooking.date === 'object') {
                if (nextBooking.date._seconds) {
                  departureTimeISO = new Date(nextBooking.date._seconds * 1000).toISOString();
                } else if (nextBooking.date.seconds) {
                  departureTimeISO = new Date(nextBooking.date.seconds * 1000).toISOString();
                } else {
                  departureTimeISO = new Date(nextBooking.date).toISOString();
                }
              } else {
                departureTimeISO = new Date(nextBooking.date).toISOString();
              }
            } catch (error) {
              console.log('Error converting booking date to ISO:', error);
              departureTimeISO = new Date().toISOString(); // Fallback to current time
            }

            const upcomingRideData: UpcomingRideData = {
              rideId: nextBooking.rideId || 'placeholder-ride-id',
              departureTime: departureTimeISO,
              from: nextBooking.pickupPoint,
              to: nextBooking.dropOffPoint,
              userRole: 'passenger',
              vehicle: vehiclePlaceholder,
            };

            console.log('Setting upcoming booking data:', upcomingRideData);
            setUpcomingRide(upcomingRideData);
          } else {
            console.log('No upcoming bookings found for passenger');
            setUpcomingRide(null);
          }
        }

      } catch (err: any) {
        console.error('Error fetching upcoming ride:', err);
        setError('Failed to fetch upcoming ride');
        setUpcomingRide(null);
      } finally {
        setLoading(false);
      }
    };

    if (userRole) {
      fetchUpcomingRide();
    } else {
      setLoading(false);
    }
  }, [userRole]);

  return { upcomingRide, loading, error };
};

export default useUpcomingRide;