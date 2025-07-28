// app/(modals)/location-picker.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Platform, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * (width / height);

// Get Google API key from environment variables
const GOOGLE_API_KEY = Platform.OS === 'android' 
  ? process.env.EXPO_PUBLIC_GOOGLE_API_KEY_ANDROID
  : process.env.EXPO_PUBLIC_GOOGLE_API_KEY_IOS;

// Default to UAE coordinates (Dubai)
const DEFAULT_REGION = {
  latitude: 25.2048,
  longitude: 55.2708,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const LocationPicker = () => {
  const { t } = useTranslation('(modals)/location-picker');

  const router = useRouter();
  const params = useLocalSearchParams<{ 
    type: string; 
    index?: string;
    currentPickup?: string;
    currentDropoff?: string;
    currentPickupName?: string;
    currentDropoffName?: string;
    context?: string;
    stopoverIndex?: string;
    currentStopovers?: string;
  }>();
  
  const { type, index, context, stopoverIndex } = params;

  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  }>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
    name: 'Dubai',
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  // Used to save the user's current location
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const reverseGeocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhanced UAE locations for quick selection
  const commonLocations = [
    { name: 'Dubai Mall', latitude: 25.197229052161752, longitude: 55.279746218387146 },
    { name: 'Dubai International Airport', latitude: 25.25669375910554, longitude: 55.36431695106583 },
    { name: 'Burj Khalifa', latitude: 25.1972, longitude: 55.2744 },
    { name: 'University of Wollongong', latitude: 25.101878891709227, longitude: 55.162749699346655 },
    { name: 'Mall of the Emirates', latitude: 25.119352791041592, longitude: 55.20004006102681 },
    { name: 'Dubai Marina', latitude: 25.0760335533753, longitude: 55.141375456005335 },
    { name: 'Zayed International Airport', latitude: 24.442563562296115, longitude: 54.649932738393545 },
    { name: 'City Centre Sharjah', latitude: 25.32472595112466, longitude: 55.39344540939053 },
    { name: 'American University of Sharjah', latitude: 25.31264142896412, longitude: 55.492693204432726 },
    { name: 'City Centre Ajman', latitude: 25.399974455625422, longitude: 55.478719818841945 },
    { name: 'Dubai Healthcare City', latitude: 25.23026024818211, longitude: 55.323349591344595 },
    { name: 'Dubai Academic City', latitude: 25.11409905310048, longitude: 55.41183399036527 },
  ];

  // Google Places API search function
  const searchLocation = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // First, filter common locations
      const filteredCommon = commonLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      );

      let searchResults = [];

      // Try Google Places API first (if API key is available)
      if (GOOGLE_API_KEY) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          // Use Google Places Text Search API
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' UAE')}&key=${GOOGLE_API_KEY}&language=en&region=ae&type=establishment|geocode`,
            {
              signal: controller.signal,
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              searchResults = data.results.slice(0, 8).map((place: any) => ({
                name: place.name,
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                fullAddress: place.formatted_address,
                types: place.types,
                placeId: place.place_id,
              }));
            }
          } else {
            console.log('Google Places API response not ok:', response.status);
          }
        } catch (googleError) {
          console.log('Google Places API failed:', googleError);
        }
      }

      // If Google Places didn't work, use Nominatim with English preference as fallback
      if (searchResults.length === 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' UAE')}&limit=5&addressdetails=1&accept-language=en`,
            {
              signal: controller.signal,
              headers: {
                'User-Agent': 'YallaGo-App',
                'Accept-Language': 'en-US,en;q=0.9'
              }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            searchResults = data.map((item: any) => {
              // Try to get English name from different fields
              let englishName = item.display_name.split(',')[0];
              
              if (item.address) {
                const addr = item.address;
                englishName = addr.amenity || addr.shop || addr.building || 
                             addr.tourism || addr.leisure || addr.office ||
                             addr.road || addr.neighbourhood || addr.suburb ||
                             addr.city || addr.town || addr.village ||
                             englishName;
              }
              
              return {
                name: englishName || item.display_name.split(',')[0],
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                fullAddress: item.display_name,
                source: 'nominatim'
              };
            });
          }
        } catch (nominatimError) {
          console.log('Nominatim API also failed:', nominatimError);
        }
      }

      // Combine common locations with search results
      const combinedResults = [
        ...filteredCommon,
        ...searchResults
      ];

      setSearchResults(combinedResults);
      setIsSearching(false);
      
    } catch (error) {
      console.log('All search methods failed:', error);
      
      // Fallback to common locations only
      const filteredCommon = commonLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredCommon);
      setIsSearching(false);
    }
  };

  // Update selected location when map region changes
  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    
    if (reverseGeocodeTimeout.current) {
      clearTimeout(reverseGeocodeTimeout.current);
    }

    reverseGeocodeTimeout.current = setTimeout(() => {
      reverseGeocode(newRegion.latitude, newRegion.longitude);
    }, 500); // 500ms debounce
  };

  const setFallbackLocation = (latitude: number, longitude: number) => {
    setSelectedLocation({
      latitude,
      longitude,
      name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    });
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=150&type=point_of_interest&key=${GOOGLE_API_KEY}&language=en`;
      console.log('Reverse geocode URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      //console.log('Geocode API response:', JSON.stringify(data, null, 2));

      if (data.status === 'OK' && data.results.length > 0) {
        const topResult = data.results[0];

        const placeName = topResult.name || topResult.vicinity || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        setSelectedLocation({
          latitude,
          longitude,
          name: placeName,
        });

      console.log(`🟢 Places API result: ${placeName}`);

        console.log(`Lat:${latitude}, Lng: ${longitude}`);
      } else {
        console.warn('Reverse geocode: no results');
        console.warn('Geocode status:', data.status);
        console.warn('Geocode results:', data.results);
        console.log(`${GOOGLE_API_KEY}`);
        setFallbackLocation(latitude, longitude); // Use helper
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      setFallbackLocation(latitude, longitude); // Use helper
    }
  };

  const handleConfirm = () => {
    if (!type || !selectedLocation) {
      Alert.alert(t('errors.missingTitle'), t('errors.missingBody'));
      return;
    }

    // Build params object preserving existing locations
    const navigationParams: any = {};
    
    // Preserve existing locations
    if (params.currentPickup && type !== 'pickup') {
      const pickup = JSON.parse(params.currentPickup);
      navigationParams.pickupName = params.currentPickupName;
      navigationParams.pickupLat = pickup.lat.toString();
      navigationParams.pickupLng = pickup.lng.toString();
    }
    
    if (params.currentDropoff && type !== 'dropoff') {
      const dropoff = JSON.parse(params.currentDropoff);
      navigationParams.dropoffName = params.currentDropoffName;
      navigationParams.dropoffLat = dropoff.lat.toString();
      navigationParams.dropoffLng = dropoff.lng.toString();
    }

    // Preserve currentStopovers param!
    if (params.currentStopovers) {
      navigationParams.currentStopovers = params.currentStopovers;
    }

    // Add new location
    if (type === 'pickup') {
      navigationParams.pickupName = selectedLocation.name;
      navigationParams.pickupLat = selectedLocation.latitude.toFixed(6);
      navigationParams.pickupLng = selectedLocation.longitude.toFixed(6);
    } else if (type === 'dropoff') {
      navigationParams.dropoffName = selectedLocation.name;
      navigationParams.dropoffLat = selectedLocation.latitude.toFixed(6);
      navigationParams.dropoffLng = selectedLocation.longitude.toFixed(6);
    } else if (type === 'stopover' && stopoverIndex) {
      navigationParams.stopoverName = selectedLocation.name;
      navigationParams.stopoverLat = selectedLocation.latitude.toFixed(6);
      navigationParams.stopoverLng = selectedLocation.longitude.toFixed(6);
      navigationParams.stopoverIndex = stopoverIndex;
    }

    if (context) {
      navigationParams.context = context;
    }

    router.push({
      pathname: '/(tabs)/home',
      params: navigationParams
    });
  };

  const selectLocation = (location: { name: string; latitude: number; longitude: number }) => {
    const newRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    
    setRegion(newRegion);
    setSelectedLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
    });
    
    mapRef.current?.animateToRegion(newRegion, 500);
    
    // Clear search when location is selected
    setSearchQuery('');
    setSearchResults([]);
  };

  // Debounced search to avoid too many API calls
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout to debounce search
    const newTimeout = setTimeout(() => {
      searchLocation(text);
    }, 500); // 500ms delay for better UX
    
    setSearchTimeout(newTimeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Get current location on mount, using expo location module
  useEffect(() => {
    const getUserLocation = async () => {
      try { // User the user for location service permission on the frontend
        console.log('Getting user location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied');

          // Fallback to default location (Dubai) if permission denied
          reverseGeocode(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
          return;
        }

        // Race between location fetch and timeout
        const location = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Location request timed out')), 7000)
          ),
        ]);

        // If resolved, location will be available here
        const coords = (location as Location.LocationObject).coords;
        const userRegion = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };

        // Keep the users current location for recenter button
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });

        // Set the map region to the user's current location
        setRegion(userRegion);

        // Animate the map view to the user's location
        mapRef.current?.animateToRegion(userRegion, 1000);

        // Use reverse geocoding to get a readable place name
        reverseGeocode(userRegion.latitude, userRegion.longitude);
      } catch (error) {
        console.warn('getCurrentPositionAsync failed, falling back to watchPositionAsync...');

        // Fallback using watchPositionAsync for one update
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (location) => {
            const coords = location.coords;
            const userRegion = {
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            };

            setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
            setRegion(userRegion);
            mapRef.current?.animateToRegion(userRegion, 1000);
            reverseGeocode(coords.latitude, coords.longitude);

            // Stop watching after first successful update
            subscription.remove();
          }
        );
      }
    };

    getUserLocation();
  }, []);

  // Get the header title based on type
  const getHeaderTitle = () => {
    switch (type) {
      case 'pickup':
        return t('title.pickup');
      case 'dropoff':
        return t('title.dropoff');
      case 'stopover':
        return t('title.stopover', { index: stopoverIndex ? parseInt(stopoverIndex) + 1 : '' });
      default:
        return t('title.default');
    }
  };

  return (
    <View className="flex-1 relative">
      {/* Header */}
      <View className="absolute top-0 left-0 right-0 z-30 pt-20 pb-2 px-4">
        <View className="flex-row items-center">
          <Pressable 
            onPress={() => router.back()} 
            className="bg-white rounded-full p-3 shadow-md"
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </Pressable>
          <View className="bg-white rounded-full px-4 py-2 ml-3 shadow-md">
            <Text className="text-lg font-[Afacad] font-bold">
              {getHeaderTitle()}
            </Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <MapView
        provider={Platform.OS === 'android' ? 'google' : undefined}
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        onMapReady={() => setIsMapReady(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={true}
        loadingIndicatorColor="#00BD5F"
        loadingBackgroundColor="#ffffff"
      />
      {userLocation && ( // recenter button for user location
        <Pressable
          onPress={() => {
            const userRegion = {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            };

            setRegion(userRegion);
            mapRef.current?.animateToRegion(userRegion, 500);
            reverseGeocode(userLocation.latitude, userLocation.longitude);
          }}
          style={{
            position: 'absolute',
            bottom: 325, // Adjust as needed to avoid overlap with bottom UI
            right: 20,
            backgroundColor: 'white',
            padding: 12,
            borderRadius: 50,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 5,
            zIndex: 50,
          }}
        >
          <Ionicons name="locate" size={24} color="#00BD5F" />
        </Pressable>
      )}

      {/* Center Pointer */}
      <View 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          marginLeft: -20,
          marginTop: -40,
        }}
        pointerEvents="none"
      >
        <Ionicons name="location-sharp" size={40} color="#00BD5F" />
      </View>

      {/* Bottom Container */}
      <View className="absolute bottom-0 left-0 right-0">
        {/* Search Bar */}
        <View className="bg-white px-4 py-3 border-b border-gray-200">
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3">
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder={t('searchPlaceholder')}
              className="flex-1 ml-3 text-base font-[Afacad]"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <View className="bg-white max-h-48 border-b border-gray-200">
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((result, index) => (
                <Pressable
                  key={index}
                  onPress={() => selectLocation(result)}
                  className="px-4 py-3 border-b border-gray-100 flex-row items-center"
                >
                  <View className="bg-gray-100 rounded-full p-2">
                    <Ionicons name="location-outline" size={18} color="#666" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-[Afacad] text-gray-800 font-semibold">
                      {result.name}
                    </Text>
                    {result.fullAddress && (
                      <Text className="text-sm font-[Afacad] text-gray-500 mt-1" numberOfLines={2}>
                        {result.fullAddress}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading indicator */}
        {isSearching && (
          <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
            <Ionicons name="sync" size={20} color="#00BD5F" />
            <Text className="ml-3 text-base font-[Afacad] text-gray-600">
              {t('searching')}
            </Text>
          </View>
        )}

        {/* Selected Location Display */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <View className="bg-[#00BD5F] rounded-full p-2">
              <Ionicons name="location" size={16} color="white" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-gray-500 font-[Afacad] mb-1">{t('selectedLabel')}</Text>
              <Text className="text-base text-gray-800 font-[Afacad] font-semibold" numberOfLines={2}>
                {selectedLocation.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Common Locations */}
        <View className="bg-white px-4 pb-3 pt-2">
          <Text className="text-sm text-gray-600 mb-3 font-[Afacad] font-semibold">
            Popular Places:
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {commonLocations.map((location, index) => (
              <Pressable
                key={index}
                onPress={() => selectLocation(location)}
                className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-full mr-2 flex-row items-center"
              >
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text className="text-gray-700 font-[Afacad] ml-1">{location.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Confirm Button */}
        <Pressable
          className="bg-[#00BD5F] py-4 items-center"
          onPress={handleConfirm}
        >
          <Text className="text-white text-lg font-[Afacad] font-semibold">
            {t('confirm')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default LocationPicker;