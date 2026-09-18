import { ScreenHeader } from '../components/ScreenHeader';
import { NotificationCard } from '../components/NotificationCard';
import { useApp } from '../store';
import { useNavigate } from 'react-router-dom';

export function Notification() {
  const { notifications, acknowledgeAlarm } = useApp();
  const navigate = useNavigate();

  return (
    <>
      <ScreenHeader title="Notification" />
      {notifications.length === 0 ? (
        <section className="rounded-2xl bg-surface px-5 py-8 text-[14px] text-muted shadow-soft md:max-w-xl">
          No active alarms or advisories for this plant.
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-5xl">
          {notifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onOpen={() => navigate(`/tanks/${item.tankId}`)}
              onAcknowledge={
                item.alarmId ? () => acknowledgeAlarm(item.tankId, item.alarmId as string) : undefined
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
