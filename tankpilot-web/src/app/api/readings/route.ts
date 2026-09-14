import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const pool = getPool();

    // Get the latest reading per sensor for each device
    const result = await pool.query(`
      SELECT DISTINCT ON (r.device_id, r.sensor_id)
        r.time,
        r.device_id,
        r.sensor_id,
        r.raw_value,
        r.value,
        r.quality,
        s.sensor_type,
        s.unit,
        s.description,
        d.device_name,
        d.location
      FROM readings r
      JOIN sensors s ON r.device_id = s.device_id AND r.sensor_id = s.sensor_id
      JOIN devices d ON r.device_id = d.device_id
      ORDER BY r.device_id, r.sensor_id, r.time DESC
    `);

    // Group readings by device
    const devices: Record<string, {
      device_id: string;
      device_name: string;
      location: string;
      last_updated: string;
      sensors: Record<string, {
        sensor_id: string;
        sensor_type: string;
        unit: string;
        description: string;
        value: number;
        raw_value: number | null;
        quality: string;
        time: string;
      }>;
    }> = {};

    for (const row of result.rows) {
      if (!devices[row.device_id]) {
        devices[row.device_id] = {
          device_id: row.device_id,
          device_name: row.device_name,
          location: row.location,
          last_updated: row.time,
          sensors: {},
        };
      }

      devices[row.device_id].sensors[row.sensor_id] = {
        sensor_id: row.sensor_id,
        sensor_type: row.sensor_type,
        unit: row.unit,
        description: row.description,
        value: parseFloat(row.value),
        raw_value: row.raw_value ? parseFloat(row.raw_value) : null,
        quality: row.quality,
        time: row.time,
      };

      // Track most recent reading time
      if (new Date(row.time) > new Date(devices[row.device_id].last_updated)) {
        devices[row.device_id].last_updated = row.time;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      devices,
    });
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch readings' },
      { status: 500 }
    );
  }
}
