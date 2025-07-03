import { useEffect, useState } from 'react';
import { loadRecentSearches, RecentSearch } from '../utils/recentSearchStorage';

const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  
  useEffect(() => {
    const fetch = async () => {
      const data = await loadRecentSearches();
      setRecentSearches(data);
    };
    fetch();
  }, []);

  return { recentSearches };
};

export default useRecentSearches;
