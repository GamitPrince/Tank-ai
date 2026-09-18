import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { Pool } from 'pg';

type ConnectNext = () => void;

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function getPool(connectionString: string) {
  const isLocal = /localhost|127\.0\.0\.1/i.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}

async function latestReadings(pool: Pool) {
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

  const devices: Record<
    string,
    {
      device_id: string;
      device_name: string;
      location: string;
      last_updated: string;
      sensors: Record<
        string,
        {
          sensor_id: string;
          sensor_type: string;
          unit: string;
          description: string;
          value: number;
          raw_value: number | null;
          quality: string;
          time: string;
        }
      >;
    }
  > = {};

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

    if (new Date(row.time) > new Date(devices[row.device_id].last_updated)) {
      devices[row.device_id].last_updated = row.time;
    }
  }

  return devices;
}

async function historyReadings(pool: Pool, deviceId: string, limit: number) {
  const result = await pool.query(
    `
    SELECT r.time, r.sensor_id, r.value, r.quality
    FROM readings r
    WHERE r.device_id = $1
    ORDER BY r.time DESC
    LIMIT $2
  `,
    [deviceId, limit * 5],
  );

  const timeMap: Record<string, Record<string, number>> = {};
  for (const row of result.rows) {
    const t = new Date(row.time).toISOString();
    if (!timeMap[t]) timeMap[t] = {};
    timeMap[t][row.sensor_id] = parseFloat(row.value);
  }

  return Object.entries(timeMap)
    .map(([time, sensors]) => ({ time, ...sensors }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(-limit);
}

export function readingsApiPlugin(databaseUrl?: string): Plugin {
  const pool = databaseUrl ? getPool(databaseUrl) : null;

  return {
    name: 'readings-api',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: ConnectNext) => {
        if (req.method !== 'GET' || !req.url) return next();

        const parsed = new URL(req.url, 'http://localhost');
        if (!parsed.pathname.startsWith('/api/readings')) return next();

        if (!pool) {
          send(res, 200, {
            success: false,
            error: 'DATABASE_URL is not configured',
            devices: {},
          });
          return;
        }

        try {
          if (parsed.pathname === '/api/readings/history') {
            const deviceId = parsed.searchParams.get('device_id') || 'rtu_level_control_01';
            const limit = parseInt(parsed.searchParams.get('limit') || '60', 10);
            const history = await historyReadings(pool, deviceId, Number.isNaN(limit) ? 60 : limit);
            send(res, 200, { success: true, device_id: deviceId, history });
            return;
          }

          if (parsed.pathname === '/api/readings') {
            const devices = await latestReadings(pool);
            send(res, 200, {
              success: true,
              timestamp: new Date().toISOString(),
              devices,
            });
            return;
          }
        } catch (error) {
          console.error('Database query error:', error);
          send(res, 500, { success: false, error: 'Failed to fetch readings' });
          return;
        }

        next();
      });
    },
  };
}
