import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('device_id') || 'rtu_level_control_01';
  const limit = parseInt(searchParams.get('limit') || '60');

  try {
    const pool = getPool();

    // Get the latest readings for the device (default up to limit * 5 to cover 5 sensors)
    const result = await pool.query(`
      SELECT
        r.time,
        r.sensor_id,
        r.value,
        r.quality
      FROM readings r
      WHERE r.device_id = $1
      ORDER BY r.time DESC
      LIMIT $2
    `, [deviceId, limit * 5]);

    // Pivot into time-series format
    const timeMap: Record<string, Record<string, number>> = {};
    for (const row of result.rows) {
      const t = new Date(row.time).toISOString();
      if (!timeMap[t]) timeMap[t] = {};
      timeMap[t][row.sensor_id] = parseFloat(row.value);
    }

    const history = Object.entries(timeMap)
      .map(([time, sensors]) => ({ time, ...sensors }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-limit);

    return NextResponse.json({
      success: true,
      device_id: deviceId,
      history,
    });
  } catch (error) {
    console.error('History query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
