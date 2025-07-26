// hooks/useUpcomingRide.ts - Fixed to handle actual backend data structure
import { useState, useEffect } from 'react';

interface UpcomingRideData {
  rideId: string;
  departureTime: string;
  from: string;
  to: string;
  userRole: 'driver' | 'passenger';
  status?: string; // ← ADD THIS LINE
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
      console.log('📅 Still loading home data...');
      setLoading(true);
      return;
    }

    try {
      setLoading(true);

      // If no upcoming data or user data, set to null
      if (!upcomingData || upcomingData.length === 0 || !userData) {
        console.log('📅 No upcoming data available');
        console.log('📅 - upcomingData exists:', !!upcomingData);
        console.log('📅 - upcomingData length:', upcomingData?.length);
        console.log('📅 - userData exists:', !!userData);
        setUpcomingRide(null);
        setLoading(false);
        return;
      }

      console.log('📅 Processing upcoming data for role:', userData.role, 'Items:', upcomingData.length);

      // Get the first upcoming item (most relevant)
      const upcomingItem = upcomingData[0];
      console.log('📅 First upcoming item structure:', JSON.stringify(upcomingItem, null, 2));

      // Process based on user role
      if (userData.role === 'driver') {
        console.log('📅 Processing as DRIVER');
        const driverRide = upcomingItem as any;
        
        console.log('📅 Driver ride fields check:');
        console.log('📅 - rideId:', driverRide.rideId);
        console.log('📅 - startLocation:', driverRide.startLocation);
        console.log('📅 - endLocation:', driverRide.endLocation);
        console.log('📅 - departureTime:', driverRide.departureTime);
        
        if (driverRide.rideId && driverRide.startLocation && driverRide.endLocation) {
          console.log('📅 ✅ Driver ride has required fields');
          
          // Handle Firestore timestamp conversion
          let departureTimeISO: string;
          try {
            if (driverRide.departureTime) {
              if (typeof driverRide.departureTime === 'object' && driverRide.departureTime._seconds) {
                // Firestore timestamp with _seconds
                departureTimeISO = new Date(driverRide.departureTime._seconds * 1000).toISOString();
                console.log('📅 Converted _seconds timestamp:', departureTimeISO);
              } else if (typeof driverRide.departureTime === 'object' && driverRide.departureTime.seconds) {
                // Firestore timestamp with seconds
                departureTimeISO = new Date(driverRide.departureTime.seconds * 1000).toISOString();
                console.log('📅 Converted seconds timestamp:', departureTimeISO);
              } else if (typeof driverRide.departureTime.toDate === 'function') {
                // Native Firestore timestamp
                departureTimeISO = driverRide.departureTime.toDate().toISOString();
                console.log('📅 Converted native timestamp:', departureTimeISO);
              } else {
                // Regular date string or timestamp
                departureTimeISO = new Date(driverRide.departureTime).toISOString();
                console.log('📅 Converted regular date:', departureTimeISO);
              }
            } else {
              departureTimeISO = new Date().toISOString();
              console.log('📅 Used current time as fallback:', departureTimeISO);
            }
          } catch (error) {
            console.error('📅 Error parsing departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          // Calculate passenger count from bookings
          console.log('📅 Bookings data:', driverRide.bookings);
          // Fixed code (CORRECT):
          const passengerCount = driverRide.bookedSeats || 0;
          console.log('📅 Total passenger count:', passengerCount);

          // In useUpcomingRide.ts - Add status to the ride object:
          const ride: UpcomingRideData = {
            rideId: driverRide.rideId,
            departureTime: departureTimeISO,
            from: driverRide.startLocation,
            to: driverRide.endLocation,
            userRole: 'driver',
            status: driverRide.status,
            passengerCount: Math.max(0, passengerCount)
          };
          
          console.log('📅 ✅ Setting driver ride:', JSON.stringify(ride, null, 2));
          setUpcomingRide(ride);
        } else {
          console.log('📅 ❌ Driver ride missing required fields');
          setUpcomingRide(null);
        }
      } else if (userData.role === 'passenger') {
        console.log('📅 Processing as PASSENGER');
        const passengerBooking = upcomingItem as any;
        
        console.log('📅 Passenger booking fields check:');
        console.log('📅 - bookingId:', passengerBooking.bookingId);
        console.log('📅 - ride object:', passengerBooking.ride);
        console.log('📅 - vehicle object:', passengerBooking.vehicle);
        console.log('📅 - driver object:', passengerBooking.driver);
        console.log('📅 - startLocation:', passengerBooking.startLocation);
        console.log('📅 - endLocation:', passengerBooking.endLocation);
        
        // Extract locations - prioritize ride context, then fallback to booking context
        let fromLocation = '';
        let toLocation = '';
        
        if (passengerBooking.ride?.startLocation && passengerBooking.ride?.endLocation) {
          fromLocation = passengerBooking.ride.startLocation;
          toLocation = passengerBooking.ride.endLocation;
          console.log('📅 Using ride.startLocation/endLocation fields');
        } else if (passengerBooking.startLocation && passengerBooking.endLocation) {
          fromLocation = passengerBooking.startLocation;
          toLocation = passengerBooking.endLocation;
          console.log('📅 Using booking startLocation/endLocation fields');
        } else if (passengerBooking.pickupPoint && passengerBooking.dropOffPoint) {
          fromLocation = passengerBooking.pickupPoint;
          toLocation = passengerBooking.dropOffPoint;
          console.log('📅 Using pickupPoint/dropOffPoint fields');
        } else {
          console.log('📅 ❌ No location fields found, using fallback');
          fromLocation = 'Your pickup location';
          toLocation = 'Your destination';
        }
        
        // Ensure we have the required fields
        const hasRequiredFields = passengerBooking.bookingId && fromLocation && toLocation;
        
        console.log('📅 Passenger booking validation:');
        console.log('📅 - hasBookingId:', !!passengerBooking.bookingId);
        console.log('📅 - hasFromLocation:', !!fromLocation);
        console.log('📅 - hasToLocation:', !!toLocation);
        console.log('📅 - hasRequiredFields:', hasRequiredFields);
        
        if (hasRequiredFields) {
          console.log('📅 ✅ Passenger booking has required fields');
          
          // Handle Firestore timestamp conversion for ride departure time
          let departureTimeISO: string;
          try {
            // Try to get departure time from ride context first, then booking context
            const rideDepTime = passengerBooking.ride?.departureTime || passengerBooking.departureTime;
            console.log('📅 Ride departure time source:', rideDepTime);
            
            if (rideDepTime) {
              if (typeof rideDepTime === 'object' && rideDepTime._seconds) {
                departureTimeISO = new Date(rideDepTime._seconds * 1000).toISOString();
                console.log('📅 Converted _seconds timestamp for passenger:', departureTimeISO);
              } else if (typeof rideDepTime === 'object' && rideDepTime.seconds) {
                departureTimeISO = new Date(rideDepTime.seconds * 1000).toISOString();
                console.log('📅 Converted seconds timestamp for passenger:', departureTimeISO);
              } else if (typeof rideDepTime.toDate === 'function') {
                departureTimeISO = rideDepTime.toDate().toISOString();
                console.log('📅 Converted native timestamp for passenger:', departureTimeISO);
              } else {
                departureTimeISO = new Date(rideDepTime).toISOString();
                console.log('📅 Converted regular date for passenger:', departureTimeISO);
              }
            } else {
              departureTimeISO = new Date().toISOString();
              console.log('📅 Used current time as fallback for passenger:', departureTimeISO);
            }
          } catch (error) {
            console.error('📅 Error parsing booking departure time:', error);
            departureTimeISO = new Date().toISOString();
          }

          // Extract vehicle information if available
          let vehicleInfo: UpcomingRideData['vehicle'] = undefined;
          if (passengerBooking.vehicle) {
            vehicleInfo = {
              make: String(passengerBooking.vehicle.make || ''),
              model: String(passengerBooking.vehicle.model || ''),
              color: String(passengerBooking.vehicle.color || ''),
              plateNumber: String(passengerBooking.vehicle.plateNumber || ''),
            };
            console.log('📅 Vehicle info extracted:', vehicleInfo);
          } else {
            console.log('📅 No vehicle info available');
          }

          const ride: UpcomingRideData = {
            rideId: passengerBooking.bookingId, // Use bookingId as the ride identifier for passengers
            departureTime: departureTimeISO,
            from: fromLocation,
            to: toLocation,
            userRole: 'passenger',
            status: passengerBooking.status,
            vehicle: vehicleInfo
          };
          
          console.log('📅 ✅ Setting passenger ride:', JSON.stringify(ride, null, 2));
          setUpcomingRide(ride);
        } else {
          console.log('📅 ❌ Passenger booking missing required fields');
          console.log('📅 - bookingId:', passengerBooking.bookingId);
          console.log('📅 - fromLocation:', fromLocation);
          console.log('📅 - toLocation:', toLocation);
          setUpcomingRide(null);
        }
      } else {
        console.log('📅 ❌ Unknown user role:', userData.role);
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
  console.log('📅 useUpcomingRide returning:');
  console.log('📅 - upcomingRide:', upcomingRide);
  console.log('📅 - loading:', loading);

  return { 
    upcomingRide, 
    loading
  };
};

export default useUpcomingRide;