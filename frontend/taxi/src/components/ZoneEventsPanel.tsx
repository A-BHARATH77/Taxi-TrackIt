import { useState, useEffect } from 'react';
import { IconMapPin, IconArrowRight, IconClock, IconActivity } from '@tabler/icons-react';

interface ZoneEvent {
  id: string;
  taxi_id: string;
  taxi_name?: string;
  event_type: 'ENTER' | 'EXIT' | 'CROSSING';
  previous_zone: string;
  current_zone: string;
  timestamp: number;
  crossed_at?: string;
}

type ViewMode = 'live' | 'history';

export function ZoneEventsPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('live');
  const [liveEvents, setLiveEvents] = useState<ZoneEvent[]>([]);
  const [historyEvents, setHistoryEvents] = useState<ZoneEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch history from API
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/zone-crossing/all?limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch zone crossing history');
      }

      const result = await response.json();
      console.log('📜 Zone crossing history response:', result);
      const data = result.data || [];
      console.log('📊 Number of history records:', data.length);

      if (data.length > 0) {
        console.log('📝 Sample record:', data[0]);
      }

      // Format events using zone names from backend
      const formattedEvents: ZoneEvent[] = data.map((item: any) => {
        const taxiId = item.taxi_id?.toString() || 'Unknown';
        const taxiName = item.taxi_name || 'Taxi';
        const prevZoneName = item.previous_zone_name || (item.previous_zone ? `Zone ${item.previous_zone}` : 'Outside');
        const currZoneName = item.current_zone_name || (item.current_zone ? `Zone ${item.current_zone}` : 'Outside');
        
        return {
          id: item.id?.toString() || `${item.taxi_id}-${item.crossed_at}`,
          taxi_id: taxiId,
          taxi_name: `${taxiName} - ${taxiId}`,
          event_type: item.event_type || 'CROSSING',
          previous_zone: prevZoneName,
          current_zone: currZoneName,
          timestamp: item.crossed_at ? new Date(item.crossed_at).getTime() : Date.now(),
          crossed_at: item.crossed_at,
        };
      });

      console.log('✅ Formatted events:', formattedEvents.length, formattedEvents.slice(0, 3));
      setHistoryEvents(formattedEvents);
    } catch (error) {
      console.error('❌ Error fetching zone crossing history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'history') {
      fetchHistory();
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'live') return;

    // Connect to WebSocket to listen for zone crossing events
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ Zone Events Panel: WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'zone_crossing') {
          const eventData = message.data;
          const taxiId = eventData.taxi_id?.toString() || 'Unknown';
          const taxiName = eventData.taxi_name || 'Taxi';
          
          const newEvent: ZoneEvent = {
            id: `${eventData.taxi_id}-${Date.now()}`,
            taxi_id: taxiId,
            taxi_name: `${taxiName} - ${taxiId}`,
            event_type: eventData.event_type,
            previous_zone: eventData.previous_zone,
            current_zone: eventData.current_zone,
            timestamp: eventData.timestamp || Date.now(),
          };

          setLiveEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
        }
      } catch (error) {
        console.error('Error parsing zone event:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Zone Events Panel: WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('❌ Zone Events Panel: WebSocket disconnected');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [viewMode]);

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'ENTER':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      case 'EXIT':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700';
      case 'CROSSING':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ENTER':
        return '🟢';
      case 'EXIT':
        return '🔴';
      case 'CROSSING':
        return '🚗';
      default:
        return '📍';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const events = viewMode === 'live' ? liveEvents : historyEvents;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2 mb-3">
          <IconMapPin className="h-5 w-5" />
          Zone Events
          {events.length > 0 && (
            <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
              ({events.length})
            </span>
          )}
        </h2>

        {/* Toggle Buttons */}
        <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
          <button
            onClick={() => setViewMode('live')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'live'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <IconActivity className="h-4 w-4" />
            Live
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'history'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <IconClock className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-800 dark:border-neutral-200"></div>
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">Loading...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <IconMapPin className="h-12 w-12 text-neutral-400 mb-4" />
            <p className="text-neutral-500 dark:text-neutral-400">
              {viewMode === 'live' ? 'No live events yet' : 'No history available'}
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
              {viewMode === 'live' 
                ? 'Events will appear here when taxis cross zone boundaries'
                : 'Zone crossing history will appear here'}
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`p-3 rounded-lg border transition-all hover:shadow-md ${getEventColor(
                event.event_type
              )}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getEventIcon(event.event_type)}</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {event.taxi_name || `Taxi ${event.taxi_id}`}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatTime(event.timestamp)}
                  </span>
                  {viewMode === 'history' && (
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {formatDate(event.timestamp)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-neutral-600 dark:text-neutral-300">
                  {event.previous_zone}
                </span>
                <IconArrowRight className="h-4 w-4 text-neutral-400" />
                <span className="text-neutral-600 dark:text-neutral-300">
                  {event.current_zone}
                </span>
              </div>

              <div className="mt-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {event.event_type}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
