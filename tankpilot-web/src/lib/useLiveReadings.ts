import { useEffect, useState, useRef } from 'react';

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

const POLL_INTERVAL = parseInt(process.env.NEXT_PUBLIC_POLL_INTERVAL || '1000');

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
    let timeoutId: ReturnType<typeof setTimeout>;
    let isFetching = false;

    const fetchData = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        const start = Date.now();
        const res = await fetch('/api/readings', { cache: 'no-store' });
        const json = await res.json();
        const elapsed = Date.now() - start;

        if (!mounted) return;

        if (json.success) {
          setData({
            devices: json.devices,
            timestamp: json.timestamp,
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
            error: json.error || 'Unknown error',
          }));
        }
      } catch (err) {
        if (!mounted) return;
        setData(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: 'Network error — cannot reach API',
        }));
      } finally {
        isFetching = false;
        if (mounted) {
          timeoutId = setTimeout(fetchData, POLL_INTERVAL);
        }
      }
    };

    // Initial fetch
    fetchData();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return data;
}
