import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function useOfflineCache(key, fetcher) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setOffline(false);
    try {
      const fresh = await fetcher();
      setData(fresh);
      await AsyncStorage.setItem(
        `cache_${key}`,
        JSON.stringify({ data: fresh, ts: Date.now() })
      );
    } catch {
      try {
        const raw = await AsyncStorage.getItem(`cache_${key}`);
        if (raw) {
          const { data: cached, ts } = JSON.parse(raw);
          setData(cached);
          setOffline(true);
          const expired = Date.now() - ts > CACHE_TTL_MS;
          if (expired) {
            fetcher()
              .then(async (fresh) => {
                setData(fresh);
                setOffline(false);
                await AsyncStorage.setItem(
                  `cache_${key}`,
                  JSON.stringify({ data: fresh, ts: Date.now() })
                );
              })
              .catch(() => {});
          }
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, offline, reload: load };
}
