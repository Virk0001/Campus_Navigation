import { memo } from 'react';
import { Clock3, MapPin, Sparkles } from 'lucide-react';
import { EventRecommendation } from '../services/eventRecommendationService';
import { EventService } from '../services/eventService';
import { cn } from '../utils';

interface RecommendedEventsProps {
  recommendations: EventRecommendation[];
  className?: string;
  onShowEvent: (recommendation: EventRecommendation) => void;
  layout?: 'vertical' | 'horizontal';
}

const RecommendedEvents = memo<RecommendedEventsProps>(({
  recommendations,
  className,
  onShowEvent,
  layout = 'vertical',
}) => {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('card overflow-hidden', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 248, 0.97), rgba(239, 246, 255, 0.92))',
        borderColor: 'rgba(59, 130, 246, 0.18)',
      }}
    >
      <div className="border-b border-blue-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recommended for You</h3>
            <p className="mt-1 text-sm text-gray-600">
              Personalized picks based on your interests and active campus events.
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        'px-4 py-4',
        layout === 'horizontal'
          ? 'flex justify-start gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory'
          : 'space-y-3'
      )}>
        {recommendations.map((recommendation) => {
          const { event, location, reasons, status, distanceKm } = recommendation;
          const dateInfo = EventService.formatEventDateTime(event);
          const isOngoing = status === 'ongoing';

          return (
            <div
              key={event._id}
              className={cn(
                'rounded-2xl border border-white/60 bg-white/85 p-4 shadow-sm backdrop-blur-sm',
                layout === 'horizontal' ? 'w-[280px] flex-none snap-start' : ''
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                        isOngoing
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      )}
                    >
                      {isOngoing ? 'Live now' : 'Upcoming'}
                    </span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-violet-700">
                      {event.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                  <span>{dateInfo.timeRange}</span>
                </div>
                {location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <span>
                      {location.name}
                      {typeof distanceKm === 'number' ? ` • ${distanceKm.toFixed(1)} km away` : ''}
                    </span>
                  </div>
                )}
              </div>

              {reasons.length > 0 && (
                <p className="mt-3 text-sm font-medium text-gray-700">
                  Why this matches: {reasons.join(' • ')}
                </p>
              )}

              <button
                type="button"
                onClick={() => onShowEvent(recommendation)}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
              >
                Show on map
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

RecommendedEvents.displayName = 'RecommendedEvents';

export default RecommendedEvents;
