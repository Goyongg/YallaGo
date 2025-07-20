// hooks/useUpcomingRide.ts - Fixed to accept upcomingData directly
import { useState, useEffect } from 'react';

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

interface UserData {
  role: string;
  [key: string]: any;
}

const useUpcomingRide = (userData: UserData | null, upcomingData: any[] | null, homeDataLoading: boolean) => {
  const [upcomingRide, setUpcomingRide] = useState<UpcomingRideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📅 useUpcomingRide Effect triggered');
    console.log('📅 homeDataLoading:', homeDataLoading);
    console.log('📅 userData:', userData);
    console.log('📅 upcomingData:', upcomingData);

    if (homeDataLoading) {
      // console.log('📅 Still loading home data...');
      setLoading(true);
      return;
    }

    try {
      setLoading(true);

      // If no upcoming data or user data, set to null
      if (!upcomingData || upcomingData.length === 0 || !userData) {
        // console.log('📅 No upcoming data available');
        // console.log('📅 - upcomingData exists:', !!upcomingData);
        // console.log('📅 - upcomingData length:', upcomingData?.length);
        // console.log('📅 - userData exists:', !!userData);
        setUpcomingRide(null);
        setLoading(false);
        return;
      }

      // console.log('📅 Processing upcoming data for role:', userData.role, 'Items:', upcomingData.length);

      // Get the first upcoming item (most relevant)
      const upcomingItem = upcomingData[0];
      // console.log('📅 First upcoming item structure:', JSON.stringify(upcomingItem, null, 2));

      // Process based on user role
      if (userData.role === 'driver') {
        // console.log('📅 Processing as DRIVER');
        const driverRide = upcomingItem as any;
        
        // console.log('📅 Driver ride fields check:');
        // console.log('📅 - rideId:', driverRide.rideId);
        // console.log('📅 - startLocation:', driverRide.startLocation);
        // console.log('📅 - endLocation:', driverRide.endLocation);
        // console.log('📅 - departureTime:', driverRide.departureTime);
        
        if (driverRide.rideId && driverRide.startLocation && driverRide.endLocation) {
          // console.log('📅 ✅ Driver ride has required fields');
          
          // Handle Firestore timestamp conversion
          let departureTimeISO: string;
          try {
            if (driverRide.departureTime) {
              if (typeof driverRide.departureTime === 'object' && driverRide.departureTime._seconds) {
                // Firestore timestamp with _seconds
                departureTimeISO = new Date(driverRide.departureTime._seconds * 1000).toISOString();
                // console.log('📅 Converted _seconds timestamp:', departureTimeISO);
              } else if (typeof driverRide.departureTime === 'object' && driverRide.departureTime.seconds) {
                // Firestore timestamp with seconds
                departureTimeISO = new Date(driverRide.departureTime.seconds * 1000).toISOString();
                // console.log('📅 Converted seconds timestamp:', departureTimeISO);
              } else if (typeof driverRide.departureTime.toDate === 'function') {
                // Native Firestore timestamp
                departureTimeISO = driverRide.departureTime.toDate().toISOString();
                // console.log('📅 Converted native timestamp:', departureTimeISO);
              } else {
                // Regular date string or timestamp
                departureTimeISO = new Date(driverRide.departureTime).toISOString();
                // console.log('📅 Converted regular date:', departureTimeISO);
              }
            } else {
              departureTimeISO = new Date().toISOString();
              // console.log('📅 Used current time as fallback:', departureTimeISO);
            }
          } catch (error) {
            console.error('📅 Error parsing departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          // Calculate passenger count from bookings
          // console.log('📅 Bookings data:', driverRide.bookings);
          const passengerCount = driverRide.bookings ? 
            driverRide.bookings.reduce((total: number, booking: any) => {
              // console.log('📅 Booking seats:', booking.seatsBooked);
              return total + (booking.seatsBooked || 0);
            }, 0) : 0;
          // console.log('📅 Total passenger count:', passengerCount);

          const ride: UpcomingRideData = {
            rideId: driverRide.rideId,
            departureTime: departureTimeISO,
            from: driverRide.startLocation,
            to: driverRide.endLocation,
            userRole: 'driver',
            passengerCount: Math.max(0, passengerCount)
          };
          
          // console.log('📅 ✅ Setting driver ride:', JSON.stringify(ride, null, 2));
          setUpcomingRide(ride);
        } else {
          // console.log('📅 ❌ Driver ride missing required fields');
          setUpcomingRide(null);
        }
      } else if (userData.role === 'passenger') {
        // console.log('📅 Processing as PASSENGER');
        const passengerBooking = upcomingItem as any;
        
        // console.log('📅 Passenger booking fields check:');
        // console.log('📅 - bookingId:', passengerBooking.bookingId);
        // console.log('📅 - pickupPoint:', passengerBooking.pickupPoint);
        // console.log('📅 - dropOffPoint:', passengerBooking.dropOffPoint);
        // console.log('📅 - ride object:', passengerBooking.ride);
        // console.log('📅 - vehicle object:', passengerBooking.vehicle);
        
        if (passengerBooking.bookingId && passengerBooking.pickupPoint && passengerBooking.dropOffPoint) {
          // console.log('📅 ✅ Passenger booking has required fields');
          
          // Handle Firestore timestamp conversion for ride departure time
          let departureTimeISO: string;
          try {
            const rideDepTime = passengerBooking.ride?.departureTime;
            // console.log('📅 Ride departure time:', rideDepTime);
            
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
              // console.log('📅 Converted passenger departure time:', departureTimeISO);
            } else {
              departureTimeISO = new Date().toISOString();
              // console.log('📅 Used current time as fallback for passenger:', departureTimeISO);
            }
          } catch (error) {
            console.error('📅 Error parsing booking departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          const ride: UpcomingRideData = {
            rideId: passengerBooking.bookingId,
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
          
          // console.log('📅 ✅ Setting passenger ride:', JSON.stringify(ride, null, 2));
          setUpcomingRide(ride);
        } else {
          // console.log('📅 ❌ Passenger booking missing required fields');
          setUpcomingRide(null);
        }
      } else {
        // console.log('📅 ❌ Unknown user role:', userData.role);
        setUpcomingRide(null);
      }

    } catch (error) {
      console.error('📅 ❌ Error processing upcoming ride data:', error);
      setUpcomingRide(null);
    } finally {
      setLoading(false);
      console.log('📅 Finished processing, loading set to false');
    }
  }, [upcomingData, userData, homeDataLoading]);

  // Debugging for the return values
  // console.log('📅 useUpcomingRide returning:');
  // console.log('📅 - upcomingRide:', upcomingRide);
  // console.log('📅 - loading:', loading);

  return { 
    upcomingRide, 
    loading
  };
};

export default useUpcomingRide;