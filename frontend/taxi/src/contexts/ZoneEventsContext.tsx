import { createContext, useContext, useState, type ReactNode } from 'react';

interface ZoneEvent {
  id: string;
  taxi_id: string;
  taxi_name?: string;
  event_type: 'ENTER' | 'EXIT' | 'CROSSING';
  previous_zone: string;
  current_zone: string;
  timestamp: number;
}

interface ZoneEventsContextType {
  liveEvents: ZoneEvent[];
  addEvent: (event: ZoneEvent) => void;
}

const ZoneEventsContext = createContext<ZoneEventsContextType | undefined>(undefined);

export function ZoneEventsProvider({ children }: { children: ReactNode }) {
  const [liveEvents, setLiveEvents] = useState<ZoneEvent[]>([]);

  const addEvent = (event: ZoneEvent) => {
    setLiveEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
  };

  return (
    <ZoneEventsContext.Provider value={{ liveEvents, addEvent }}>
      {children}
    </ZoneEventsContext.Provider>
  );
}

export function useZoneEvents() {
  const context = useContext(ZoneEventsContext);
  if (context === undefined) {
    throw new Error('useZoneEvents must be used within a ZoneEventsProvider');
  }
  return context;
}
