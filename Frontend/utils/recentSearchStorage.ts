// utils/recentSearchStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recentSearches';

export interface RecentSearch {
  from: string;
  to: string;
  passengers: number;
  date?: string;
  femaleOnly?: boolean;
}

export const saveRecentSearch = async (search: RecentSearch) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    let searches: RecentSearch[] = json ? JSON.parse(json) : [];

    // Remove duplicates
    searches = searches.filter(
      s => !(s.from === search.from && s.to === search.to && s.passengers === search.passengers)
    );

    // Add new one at the beginning
    searches.unshift(search);

    // Limit to last 5
    if (searches.length > 5) searches = searches.slice(0, 5);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch (err) {
    console.error('Error saving recent search:', err);
  }
};

export const loadRecentSearches = async (): Promise<RecentSearch[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (err) {
    console.error('Error loading recent searches:', err);
    return [];
  }
};
