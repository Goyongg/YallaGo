// app/(modals)/location-picker.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Platform, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import MapView, { Region } from 'react-native-maps';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

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
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    type: string; 
    index?: string;
    currentPickup?: string;
    currentDropoff?: string;
    currentPickupName?: string;
    currentDropoffName?: string;
    context?: string; // Add context parameter
  }>();
  
  const { type, index, context } = params;

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

  // Enhanced UAE locations for quick selection
  const commonLocations = [
    { name: 'Dubai Mall', latitude: 25.1972, longitude: 55.2744 },
    { name: 'Dubai International Airport', latitude: 25.2532, longitude: 55.3657 },
    { name: 'Burj Khalifa', latitude: 25.1972, longitude: 55.2744 },
    { name: 'Dubai Marina', latitude: 25.0800, longitude: 55.1400 },
    { name: 'Abu Dhabi International Airport', latitude: 24.4330, longitude: 54.6511 },
    { name: 'Dubai Internet City', latitude: 25.0955, longitude: 55.1680 },
    { name: 'Sharjah City Centre', latitude: 25.3463, longitude: 55.4209 },
    { name: 'American University of Sharjah', latitude: 25.3129, longitude: 55.4814 },
    { name: 'Ajman City Centre', latitude: 25.4052, longitude: 55.5136 },
    { name: 'Dubai Knowledge Village', latitude: 25.1074, longitude: 55.1719 },
    { name: 'Dubai Healthcare City', latitude: 25.2285, longitude: 55.3273 },
    { name: 'Dubai Academic City', latitude: 25.1167, longitude: 55.4050 },
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
    
    // Use reverse geocoding to get location name
    reverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  // Reverse geocoding to get location name from coordinates
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      if (GOOGLE_API_KEY) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}&language=en`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length > 0) {
            const result = data.results[0];
            const locationName = result.formatted_address.split(',')[0] || 
                               result.address_components[0]?.long_name || 
                               'Selected Location';
            
            setSelectedLocation({
              latitude,
              longitude,
              name: locationName,
            });
            return;
          }
        }
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates if reverse geocoding fails
    setSelectedLocation({
      latitude,
      longitude,
      name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    });
  };

  const handleConfirm = () => {
    if (!type || !selectedLocation) {
      Alert.alert('Missing Information', 'Please select a location');
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
    
    // Add new location
    if (type === 'pickup') {
      navigationParams.pickupName = selectedLocation.name;
      navigationParams.pickupLat = selectedLocation.latitude.toFixed(6);
      navigationParams.pickupLng = selectedLocation.longitude.toFixed(6);
    } else if (type === 'dropoff') {
      navigationParams.dropoffName = selectedLocation.name;
      navigationParams.dropoffLat = selectedLocation.latitude.toFixed(6);
      navigationParams.dropoffLng = selectedLocation.longitude.toFixed(6);
    }

    // Add context to maintain form separation
    if (context) {
      navigationParams.context = context;
    }

    // Navigate back with all params
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

  // Get current location on mount
  useEffect(() => {
    // Initialize with reverse geocoding for default location
    reverseGeocode(DEFAULT_REGION.latitude, DEFAULT_REGION.longitude);
  }, []);

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
              Select {type === 'pickup' ? 'Pickup' : 'Drop-off'} Location
            </Text>
          </View>
        </View>
      </View>

      {/* Map */}
      <MapView
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
              placeholder="Search for a location..."
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
              Searching...
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
              <Text className="text-sm text-gray-500 font-[Afacad] mb-1">Selected Location:</Text>
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
            Confirm Location
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default LocationPicker;