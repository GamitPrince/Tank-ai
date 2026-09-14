import { useEffect, useState } from 'react';

export interface SensorReading {
  sensor_id: string;
  sensor_type: string;
  unit: string;
  description: string;
  value: number;
  raw_value: number | null;
  quality: string;
  time: string;
}

export interface DeviceData {
  device_id: string;
  device_name: string;
  location: string;
  last_updated: string;
  sensors: Record<string, SensorReading>;
}

export interface LiveData {
  devices: Record<string, DeviceData>;
  timestamp: string;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
}

const POLL_INTERVAL = 1500;

export function useLiveReadings(): LiveData {
  const [data, setData] = useState<LiveData>({
    devices: {},
    timestamp: '',
    isConnected: false,
    isLoading: true,
    error: null,
    lastFetchTime: null,
  });

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isFetching = false;

    // Timeout safety fallback: never leave the screen stuck on loading > 5 seconds
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setData(prev => prev.isLoading ? { ...prev, isLoading: false, error: prev.error || 'Connection timed out. Retrying...' } : prev);
      }
    }, 5000);

    const fetchData = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const start = Date.now();
        const res = await fetch('/api/readings', { cache: 'no-store' });
        const elapsed = Date.now() - start;

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();

        if (!mounted) return;

        if (json.success) {
          setData({
            devices: json.devices || {},
            timestamp: json.timestamp || new Date().toISOString(),
            isConnected: true,
            isLoading: false,
            error: null,
            lastFetchTime: elapsed,
          });
        } else {
          setData(prev => ({
            ...prev,
            isConnected: false,
            isLoading: false,
            error: json.error || 'Server error fetching readings',
            lastFetchTime: elapsed,
          }));
        }
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : 'Network error';
        setData(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: msg,
        }));
      } finally {
        isFetching = false;
        if (mounted) {
          timeoutId = setTimeout(fetchData, POLL_INTERVAL);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return data;
}
