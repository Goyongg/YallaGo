// hooks/useUpcomingRide.ts - IMPROVED to use /bookings endpoint for passengers
import { useState, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { BASE_URL } from '@/config';

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

// Interface for booking data from /bookings endpoint (matching useBookingHistory)
interface BookingDetail {
  bookingId: string;
  rideId: string;
  startLocation: string;
  endLocation: string;
  departureTime: {
    _seconds: number;
    _nanoseconds: number;
  };
  status: string;
  seatsBooked: number;
  // Driver info (in upcoming bookings)
  name?: string;
  phoneNumber?: string;
  averageRating?: number;
  // Vehicle info (in upcoming bookings)
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
}

const useUpcomingRide = (userData: UserData | null, upcomingData: any[] | null, homeDataLoading: boolean) => {
  const [upcomingRide, setUpcomingRide] = useState<UpcomingRideData | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch detailed booking data for passengers
  const fetchPassengerBookingDetails = async (bookingId: string): Promise<BookingDetail | null> => {
    try {
      console.log('📅 🔍 Fetching detailed booking data for:', bookingId);
      
      const user = auth().currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await axios.get<BookingDetail[]>(`${BASE_URL}/bookings`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        timeout: 10000,
      });

      console.log('📅 📋 All bookings from /bookings endpoint:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('📅 ❌ Invalid booking response format');
        return null;
      }

      // Find the specific booking by bookingId
      const targetBooking = response.data.find((booking: BookingDetail) => 
        booking.bookingId === bookingId
      );

      if (!targetBooking) {
        console.error('📅 ❌ Booking not found in /bookings response:', bookingId);
        return null;
      }

      console.log('📅 ✅ Found detailed booking data:', targetBooking);
      return targetBooking;

    } catch (error) {
      console.error('📅 ❌ Error fetching detailed booking data:', error);
      return null;
    }
  };

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

    const processUpcomingData = async () => {
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
          console.log('📅 Processing as DRIVER (using existing logic)');
          const driverRide = upcomingItem as any;
          
          console.log('📅 Driver ride fields check:');
          console.log('📅 - rideId:', driverRide.rideId);
          console.log('📅 - startLocation:', driverRide.startLocation);
          console.log('📅 - endLocation:', driverRide.endLocation);
          
          if (driverRide.rideId && driverRide.startLocation && driverRide.endLocation) {
            console.log('📅 ✅ Driver ride has required fields');
            
            // Handle Firestore timestamp conversion
            let departureTimeISO: string;
            try {
              if (driverRide.departureTime) {
                if (typeof driverRide.departureTime === 'object' && driverRide.departureTime._seconds) {
                  departureTimeISO = new Date(driverRide.departureTime._seconds * 1000).toISOString();
                } else if (typeof driverRide.departureTime === 'object' && driverRide.departureTime.seconds) {
                  departureTimeISO = new Date(driverRide.departureTime.seconds * 1000).toISOString();
                } else if (typeof driverRide.departureTime.toDate === 'function') {
                  departureTimeISO = driverRide.departureTime.toDate().toISOString();
                } else {
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
              driverRide.bookings.reduce((total: number, booking: any) => {
                return total + (booking.seatsBooked || 0);
              }, 0) : 0;

            const ride: UpcomingRideData = {
              rideId: driverRide.rideId,
              departureTime: departureTimeISO,
              from: driverRide.startLocation,
              to: driverRide.endLocation,
              userRole: 'driver',
              passengerCount: Math.max(0, passengerCount)
            };
            
            console.log('📅 ✅ Setting driver ride:', JSON.stringify(ride, null, 2));
            setUpcomingRide(ride);
          } else {
            console.log('📅 ❌ Driver ride missing required fields');
            setUpcomingRide(null);
          }
          
        } else if (userData.role === 'passenger') {
          console.log('📅 Processing as PASSENGER (using /bookings endpoint)');
          const passengerBooking = upcomingItem as any;
          
          console.log('📅 Passenger booking basic check:');
          console.log('📅 - bookingId:', passengerBooking.bookingId);
          
          if (passengerBooking.bookingId) {
            console.log('📅 ✅ Found upcoming booking, fetching detailed data...');
            
            // 🔧 NEW: Fetch detailed booking data from /bookings endpoint
            const detailedBooking = await fetchPassengerBookingDetails(passengerBooking.bookingId);
            
            if (detailedBooking) {
              console.log('📅 ✅ Processing detailed booking data');
              
              // Handle Firestore timestamp conversion
              let departureTimeISO: string;
              try {
                const depTime = detailedBooking.departureTime;
                if (depTime && depTime._seconds) {
                  departureTimeISO = new Date(depTime._seconds * 1000).toISOString();
                } else {
                  departureTimeISO = new Date().toISOString();
                }
              } catch (error) {
                console.error('📅 Error parsing detailed booking departure time:', error);
                departureTimeISO = new Date().toISOString();
              }

              // Extract vehicle info from detailed booking
              let vehicleInfo: UpcomingRideData['vehicle'] = undefined;
              if (detailedBooking.make && detailedBooking.model) {
                vehicleInfo = {
                  make: detailedBooking.make,
                  model: detailedBooking.model,
                  color: detailedBooking.color || 'Unknown',
                  plateNumber: detailedBooking.plateNumber || 'N/A',
                };
              }

              const ride: UpcomingRideData = {
                rideId: detailedBooking.bookingId, // Use bookingId for navigation
                departureTime: departureTimeISO,
                from: detailedBooking.startLocation || 'Pickup Location',
                to: detailedBooking.endLocation || 'Destination',
                userRole: 'passenger',
                vehicle: vehicleInfo
              };
              
              console.log('📅 ✅ Setting detailed passenger ride:', JSON.stringify(ride, null, 2));
              setUpcomingRide(ride);
            } else {
              console.log('📅 ❌ Failed to fetch detailed booking data, using fallback');
              
              // 🔧 FALLBACK: Use basic data from /users/home if /bookings fails
              let departureTimeISO: string;
              try {
                const rideDepTime = passengerBooking.ride?.departureTime;
                if (rideDepTime && rideDepTime._seconds) {
                  departureTimeISO = new Date(rideDepTime._seconds * 1000).toISOString();
                } else {
                  departureTimeISO = new Date().toISOString();
                }
              } catch (error) {
                departureTimeISO = new Date().toISOString();
              }

              const fallbackRide: UpcomingRideData = {
                rideId: passengerBooking.bookingId,
                departureTime: departureTimeISO,
                from: 'Your Pickup Location',
                to: 'Your Destination',
                userRole: 'passenger',
                vehicle: passengerBooking.vehicle ? {
                  make: passengerBooking.vehicle.make,
                  model: passengerBooking.vehicle.model,
                  color: passengerBooking.vehicle.color,
                  plateNumber: passengerBooking.vehicle.plateNumber
                } : undefined
              };
              
              console.log('📅 ⚠️ Setting fallback passenger ride:', JSON.stringify(fallbackRide, null, 2));
              setUpcomingRide(fallbackRide);
            }
          } else {
            console.log('📅 ❌ Passenger booking missing bookingId');
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
    };

    processUpcomingData();
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