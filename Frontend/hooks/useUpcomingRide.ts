// hooks/useUpcomingRide.ts - Fixed to use new homepage data structure
import { useState, useEffect } from 'react';
import useHomeUserData from './useHomeUserData';

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
  const { userData, upcomingData, loading: homeDataLoading, error, refetch } = useHomeUserData();

  useEffect(() => {
    if (homeDataLoading) {
      setLoading(true);
      return;
    }

    try {
      setLoading(true);

      // If no upcoming data or user data, set to null
      if (!upcomingData || upcomingData.length === 0 || !userData) {
        console.log('📅 No upcoming data available');
        setUpcomingRide(null);
        setLoading(false);
        return;
      }

      console.log('📅 Processing upcoming data for role:', userData.role, 'Items:', upcomingData.length);

      // Get the first upcoming item (most relevant)
      const upcomingItem = upcomingData[0];
      console.log('📅 First upcoming item:', upcomingItem);

      // Process based on user role
      if (userData.role === 'driver') {
        // Driver upcoming ride data - check if it has driver-specific fields
        const driverRide = upcomingItem as any;
        
        if (driverRide.rideId && driverRide.startLocation && driverRide.endLocation) {
          console.log('📅 Processing driver ride:', driverRide.rideId);
          
          // Handle Firestore timestamp conversion
          let departureTimeISO: string;
          try {
            if (driverRide.departureTime) {
              if (typeof driverRide.departureTime === 'object' && driverRide.departureTime._seconds) {
                // Firestore timestamp with _seconds
                departureTimeISO = new Date(driverRide.departureTime._seconds * 1000).toISOString();
              } else if (typeof driverRide.departureTime === 'object' && driverRide.departureTime.seconds) {
                // Firestore timestamp with seconds
                departureTimeISO = new Date(driverRide.departureTime.seconds * 1000).toISOString();
              } else if (typeof driverRide.departureTime.toDate === 'function') {
                // Native Firestore timestamp
                departureTimeISO = driverRide.departureTime.toDate().toISOString();
              } else {
                // Regular date string or timestamp
                departureTimeISO = new Date(driverRide.departureTime).toISOString();
              }
            } else {
              departureTimeISO = new Date().toISOString();
            }
          } catch (error) {
            console.error('📅 Error parsing departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          // Calculate passenger count from bookings
          const passengerCount = driverRide.bookings ? 
            driverRide.bookings.reduce((total: number, booking: any) => total + (booking.seatsBooked || 0), 0) : 0;

          const ride: UpcomingRideData = {
            rideId: driverRide.rideId,
            departureTime: departureTimeISO,
            from: driverRide.startLocation,
            to: driverRide.endLocation,
            userRole: 'driver',
            passengerCount: Math.max(0, passengerCount) // Ensure non-negative
          };
          
          console.log('📅 Setting driver ride:', ride);
          setUpcomingRide(ride);
        } else {
          console.log('📅 Driver ride missing required fields');
          setUpcomingRide(null);
        }
      } else {
        // Passenger upcoming booking data - check if it has passenger-specific fields
        const passengerBooking = upcomingItem as any;
        
        if (passengerBooking.bookingId && passengerBooking.pickupPoint && passengerBooking.dropOffPoint) {
          console.log('📅 Processing passenger booking:', passengerBooking.bookingId);
          
          // Handle Firestore timestamp conversion for ride departure time
          let departureTimeISO: string;
          try {
            const rideDepTime = passengerBooking.ride?.departureTime;
            if (rideDepTime) {
              if (typeof rideDepTime === 'object' && rideDepTime._seconds) {
                departureTimeISO = new Date(rideDepTime._seconds * 1000).toISOString();
              } else if (typeof rideDepTime === 'object' && rideDepTime.seconds) {
                departureTimeISO = new Date(rideDepTime.seconds * 1000).toISOString();
              } else if (typeof rideDepTime.toDate === 'function') {
                departureTimeISO = rideDepTime.toDate().toISOString();
              } else {
                departureTimeISO = new Date(rideDepTime).toISOString();
              }
            } else {
              departureTimeISO = new Date().toISOString();
            }
          } catch (error) {
            console.error('📅 Error parsing booking departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          const ride: UpcomingRideData = {
            rideId: passengerBooking.bookingId, // Use bookingId as identifier for passengers
            departureTime: departureTimeISO,
            from: passengerBooking.pickupPoint,
            to: passengerBooking.dropOffPoint,
            userRole: 'passenger',
            vehicle: passengerBooking.vehicle ? {
              make: passengerBooking.vehicle.make,
              model: passengerBooking.vehicle.model,
              color: passengerBooking.vehicle.color,
              plateNumber: passengerBooking.vehicle.plateNumber
            } : undefined
          };
          
          console.log('📅 Setting passenger ride:', ride);
          setUpcomingRide(ride);
        } else {
          console.log('📅 Passenger booking missing required fields');
          setUpcomingRide(null);
        }
      }

    } catch (error) {
      console.error('📅 Error processing upcoming ride data:', error);
      setUpcomingRide(null);
    } finally {
      setLoading(false);
    }
  }, [upcomingData, userData, homeDataLoading]);

  return { 
    upcomingRide, 
    loading: loading || homeDataLoading,
    error 
  };
};

export default useUpcomingRide;