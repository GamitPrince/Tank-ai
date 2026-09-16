import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Activity, Clock } from 'lucide-react';
import { ScreenHeader } from '../components/ScreenHeader';
import { SimpleChart } from '../components/SimpleChart';
import { useApp } from '../store';

// Generate some mock historical data based on the tank's current volume
function generateMockHistory(currentVolume: number) {
  const data = [];
  let vol = currentVolume;
  // Generate 60 points for the last 60 minutes
  for (let i = 60; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60000).toISOString();
    data.push({ time, value: vol });
    
    // Reverse engineer previous volumes by randomly adding/subtracting a bit
    const change = (Math.random() * 2 - 0.8) * (currentVolume * 0.05); // slight downward trend historically means we subtract when going back, so we add when going forward
    vol = Math.max(0, vol - change);
  }
  return data;
}

export function Consumption() {
  const { tankId } = useParams();
  const { getTank, extras } = useApp();
  const tank = tankId ? getTank(tankId) : undefined;
  
  const [historyData, setHistoryData] = useState<{time: string, value: number}[]>([]);

  const extra = tank ? extras[tank.id] : undefined;

  useEffect(() => {
    if (extra?.volumeM3) {
      setHistoryData(generateMockHistory(extra.volumeM3));
    }
  }, [extra?.volumeM3]);

  if (!tank || !extra) return <Navigate to="/dashboard" replace />;

  return (
    <>
      <ScreenHeader backTo={`/tanks/${tank.id}`} />
      
      <div className="mb-6 lg:hidden">
        <h1 className="text-[22px] font-extrabold text-brand">Consumption History</h1>
        <p className="mt-1 text-[13px] text-muted">Tank {tank.index} · {tank.productName}</p>
      </div>

      <div className="flex flex-col gap-5 lg:gap-6">
        {/* Main Chart Card */}
        <section className="rounded-2xl bg-surface px-5 py-6 shadow-soft lg:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-brand" />
            <h2 className="text-[16px] font-bold text-ink">Volume Trend (Last 1 Hour)</h2>
          </div>
          
          <div className="mb-4">
            <SimpleChart data={historyData} color="#0ea5e9" height={220} labelY="m³" />
          </div>
          
          <div className="flex justify-between items-center text-[12px] text-muted font-medium mt-2">
            <span>60 mins ago</span>
            <span>Now</span>
          </div>
        </section>

        {/* Current Rates */}
        {extra && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface px-5 py-5 shadow-soft">
              <p className="text-[13px] font-semibold text-muted">Current Filling Rate</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-extrabold text-success">
                  {extra.fillingRate > 0 ? `+${extra.fillingRate.toFixed(1)}` : '0.0'}
                </span>
                <span className="text-[13px] text-muted font-medium">m³/hr</span>
              </div>
            </div>
            
            <div className="rounded-2xl bg-surface px-5 py-5 shadow-soft">
              <p className="text-[13px] font-semibold text-muted">Current Emptying Rate</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[28px] font-extrabold text-danger">
                  {extra.emptyingRate < 0 ? extra.emptyingRate.toFixed(1) : '0.0'}
                </span>
                <span className="text-[13px] text-muted font-medium">m³/hr</span>
              </div>
            </div>
          </section>
        )}
        
        {/* Analytics Card */}
        <section className="rounded-2xl bg-brand/5 border border-brand/10 px-5 py-5">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-brand shrink-0" />
            <div>
              <p className="text-[14px] font-bold text-brand">Historical Analysis</p>
              <p className="text-[13px] text-brand/80 mt-1 leading-relaxed">
                The current consumption patterns are being actively monitored. Based on recent emptying rates, 
                maintain standard operating procedures. The system will alert you if abnormal consumption is detected.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
