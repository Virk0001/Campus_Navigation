import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
// @ts-ignore - leaflet-routing-machine doesn't have proper ES module exports
import 'leaflet-routing-machine';
import { MAP_CONFIG, MARKER_ICONS } from '../../config/mapConfig';
import { Location, Event } from '../../types';
import { EventService } from '../../services/eventService';

// Fix for default markers in Leaflet with Webpack/Vite (avoid explicit any)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  locations: Location[];
  events?: Event[];
  selectedLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  onEventSelect?: (event: Event) => void;
  className?: string;
  enableRouting?: boolean;
  routingMode?: boolean;
  onToggleRouting?: () => void;
}

type RouteTarget = 'start' | 'destination';

export const LeafletMap = memo<LeafletMapProps>(({
  locations = [],
  events = [],
  selectedLocation,
  onLocationSelect,
  onEventSelect,
  className = '',
  enableRouting = false,
  routingMode = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const eventMarkersRef = useRef<L.Marker[]>([]); // Separate ref for event markers
  const routingControlRef = useRef<any>(null); // Routing control reference
  const waypointMarkersRef = useRef<Array<L.Marker | null>>([null, null]); // Start / destination markers
  
  // Existing state
  // const [mapStyle, setMapStyle] = useState<'default' | 'satellite' | 'dark' | 'terrain'>('default');
  const [showEvents] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // New routing state
  const [routePoints, setRoutePoints] = useState<{ start: L.LatLng | null; destination: L.LatLng | null }>({
    start: null,
    destination: null
  });
  const [routePointLabels, setRoutePointLabels] = useState<{ start: string | null; destination: string | null }>({
    start: null,
    destination: null
  });
  const [activeRouteTarget, setActiveRouteTarget] = useState<RouteTarget>('start');
  const [routeInfo, setRouteInfo] = useState<{distance: string; time: string; instructions: string[]} | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Memoized callback for location selection
  const handleLocationSelect = useCallback((location: Location) => {
    onLocationSelect?.(location);
  }, [onLocationSelect]);

  const removeWaypointMarker = useCallback((target: RouteTarget) => {
    const index = target === 'start' ? 0 : 1;
    const marker = waypointMarkersRef.current[index];
    if (marker && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(marker);
    }
    waypointMarkersRef.current[index] = null;
  }, []);

  const renderWaypointMarker = useCallback((target: RouteTarget, point: L.LatLng, label: string) => {
    if (!mapInstanceRef.current) return;

    const index = target === 'start' ? 0 : 1;
    removeWaypointMarker(target);

    const markerColor = target === 'start' ? '#22c55e' : '#ef4444';
    const markerBadge = target === 'start' ? 'A' : 'B';
    const markerTitle = target === 'start' ? 'Start Point' : 'Destination';

    const waypointMarker = L.marker(point, {
      icon: L.divIcon({
        html: `
          <div style="
            background: ${markerColor};
            color: white;
            border-radius: 50%;
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 6px 14px rgba(0,0,0,0.35);
          ">${markerBadge}</div>
        `,
        iconSize: [42, 42],
        iconAnchor: [21, 42],
        className: 'routing-waypoint-marker'
      }),
      zIndexOffset: 1000
    });

    waypointMarker.bindPopup(`
      <div style="padding: 8px; font-family: Inter, sans-serif;">
        <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: ${markerColor};">
          ${markerTitle}
        </h4>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #374151;">
          ${label}
        </p>
      </div>
    `);

    waypointMarker.addTo(mapInstanceRef.current);
    waypointMarkersRef.current[index] = waypointMarker;
  }, [removeWaypointMarker]);

  const setRoutePoint = useCallback((target: RouteTarget, point: L.LatLng, label: string) => {
    renderWaypointMarker(target, point, label);
    setRoutePoints(prev => ({ ...prev, [target]: point }));
    setRoutePointLabels(prev => ({ ...prev, [target]: label }));
    setRouteInfo(null);
    setCurrentStepIndex(0);
    setActiveRouteTarget(target === 'start' ? 'destination' : 'start');

    const successMessage = target === 'start'
      ? 'Start point selected. Now choose the destination.'
      : 'Destination selected. Calculating route...';

    toast.success(successMessage, { duration: 2200 });
  }, [renderWaypointMarker]);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!routingMode || !enableRouting || !mapInstanceRef.current) return;

    const targetToFill: RouteTarget =
      !routePoints.start ? 'start' : !routePoints.destination ? 'destination' : activeRouteTarget;

    setRoutePoint(targetToFill, e.latlng, 'Pinned on map');
  }, [routingMode, enableRouting, routePoints.start, routePoints.destination, activeRouteTarget, setRoutePoint]);

  const handleClearRoute = useCallback(() => {
    setRoutePoints({ start: null, destination: null });
    setRoutePointLabels({ start: null, destination: null });
    setRouteInfo(null);
    setCurrentStepIndex(0);
    setActiveRouteTarget('start');
    
    // Remove routing control
    if (routingControlRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    
    // Clear waypoint markers
    removeWaypointMarker('start');
    removeWaypointMarker('destination');
    
    toast.success('Route cleared', { duration: 1500 });
  }, [removeWaypointMarker]);

  const handleSwapRoute = useCallback(() => {
    if (!routePoints.start || !routePoints.destination) return;

    const nextStart = routePoints.destination;
    const nextDestination = routePoints.start;
    const nextStartLabel = routePointLabels.destination || 'Destination';
    const nextDestinationLabel = routePointLabels.start || 'Start';

    renderWaypointMarker('start', nextStart, nextStartLabel);
    renderWaypointMarker('destination', nextDestination, nextDestinationLabel);
    setRoutePoints({ start: nextStart, destination: nextDestination });
    setRoutePointLabels({ start: nextStartLabel, destination: nextDestinationLabel });
    setRouteInfo(null);
    setCurrentStepIndex(0);
    toast.success('Start and destination swapped', { duration: 1800 });
  }, [routePoints.start, routePoints.destination, routePointLabels.destination, routePointLabels.start, renderWaypointMarker]);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      try {
        // Clear any existing map instance from the container
        if ((mapRef.current as any)._leaflet_id) {
          delete (mapRef.current as any)._leaflet_id;
        }

        // Set campus bounds - restrict map to Thapar campus area for better UX
        // VERSION: v7-large-campus-bounds-2024-10-14
        const bounds = L.latLngBounds(
          [MAP_CONFIG.center.lat - 0.015, MAP_CONFIG.center.lng - 0.018],  // Southwest (~1650m × 2000m)
          [MAP_CONFIG.center.lat + 0.015, MAP_CONFIG.center.lng + 0.018]   // Northeast (large campus area)
        );

        // Create map instance with bounds options
        const map = L.map(mapRef.current, {
          zoomControl: false,           // We'll add custom controls
          maxBounds: bounds,            // Restrict panning to campus area
          maxBoundsViscosity: 1.0       // Make bounds "sticky" - prevents panning outside
        }).setView(
          [MAP_CONFIG.center.lat, MAP_CONFIG.center.lng],
          MAP_CONFIG.zoom
        );

        // Add zoom control in bottom right
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);

        // Add tile layer
        const tileLayer = L.tileLayer(MAP_CONFIG.tileLayer.url, {
          attribution: MAP_CONFIG.tileLayer.attribution,
          maxZoom: MAP_CONFIG.maxZoom,
          minZoom: MAP_CONFIG.minZoom
        });
        
        tileLayer.addTo(map);

        mapInstanceRef.current = map;
        
        // Add click handler for routing
        map.on('click', handleMapClick);
        
        setIsMapLoaded(true);
        setMapError(null);
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to load map. Please refresh the page.');
        toast.error('Failed to load map. Please refresh.');
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [handleMapClick]);

  // Handle routing when waypoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !enableRouting || !routePoints.start || !routePoints.destination) {
      return;
    }

    // Remove existing routing control
    if (routingControlRef.current) {
      mapInstanceRef.current.removeControl(routingControlRef.current);
    }

    try {
      // Create routing control with OpenRouteService
      routingControlRef.current = (L as any).Routing.control({
        waypoints: [routePoints.start, routePoints.destination],
        routeWhileDragging: false,
        addWaypoints: false,
        // Don't create default markers - we handle them manually for better control
        createMarker: function() {
          return null; // Return null to prevent default markers
        },
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot', // Walking routes for campus
        }),
        lineOptions: {
          styles: [
            { color: '#3b82f6', opacity: 0.8, weight: 6 },
            { color: '#ffffff', opacity: 0.9, weight: 4 }
          ]
        },
        show: false, // Hide the routing panel to keep UI clean
        collapsible: false
      }).on('routesfound', function(e: any) {
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          const distance = (route.summary.totalDistance / 1000).toFixed(2) + ' km';
          const time = Math.round(route.summary.totalTime / 60) + ' min';
          const instructions = route.instructions?.map((instruction: any) => instruction.text) || [];
          
          setRouteInfo({ distance, time, instructions });
          toast.success(`Route found: ${distance}, ${time}`, { duration: 3000 });
        }
      }).on('routingerror', function(e: { error: { message: string } }) {
        console.error('Routing error:', e);
        toast.error('Could not find route between selected points');
        setRouteInfo(null);
      }).addTo(mapInstanceRef.current);

    } catch (error) {
      console.error('Error creating route:', error);
      toast.error('Error creating route. Please try again.');
    }
  }, [routePoints.start, routePoints.destination, enableRouting]);

  // Use the already filtered locations from props (no fallback - empty means show nothing)
  const filteredLocations = useMemo(() => {
    if (Array.isArray(locations)) return locations;
    return [];
  }, [locations]);

  // Update markers when locations or events change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

  // Add location markers
  filteredLocations.forEach(location => {
      if (location.coordinates) {
        // Find events at this location and check if any are ongoing
        const locationEvents = showEvents && Array.isArray(events) ? events.filter(event => {
          const eventLocId = typeof event.locationId === 'object' ? event.locationId._id : event.locationId;
          return eventLocId === location._id;
        }) : [];
        
        const hasEvents = locationEvents.length > 0;
        
        // Check if any event is currently ongoing
        const hasOngoingEvent = locationEvents.some(event => {
          const status = EventService.getEventStatus(event);
          return status === 'ongoing';
        });
        
        // Get type-specific emoji and color
        const emoji = MARKER_ICONS[location.type as keyof typeof MARKER_ICONS] || '📍';
        // Vibrant colors for better visibility - LARGER sizes for event locations
        const markerSize = hasEvents ? 32 : 24; // Bigger for events
        const iconSize = hasEvents ? 18 : 14; // Bigger emoji for events
        
        const typeColors: Record<string, string> = {
          'hostel': '#fbbf24',       // Vibrant yellow
          'class': '#3b82f6',        // Vibrant blue
          'faculty': '#a855f7',      // Vibrant purple
          'entertainment': '#ec4899', // Vibrant pink
          'shop': '#f97316',         // Vibrant orange
          'parking': '#9ca3af',      // Gray
          'medical': '#ef4444',      // Red
          'sports': '#22c55e',       // Bright green
          'eatables': '#f59e0b',     // Amber
          'religious': '#8b5cf6'     // Purple
        };
        const borderColors: Record<string, string> = {
          'hostel': '#d97706',       // Dark yellow
          'class': '#1e40af',        // Dark blue
          'faculty': '#7c3aed',      // Dark purple
          'entertainment': '#be185d', // Dark pink
          'shop': '#c2410c',         // Dark orange
          'parking': '#4b5563',      // Dark gray
          'medical': '#b91c1c',      // Dark red
          'sports': '#15803d',       // Dark green
          'eatables': '#c2410c',     // Dark amber
          'religious': '#6b21a8'     // Dark purple
        };
        const baseColor = typeColors[location.type] || '#3b82f6';
        const borderColor = borderColors[location.type] || '#1e40af';
        
        // Different glow effects: ONGOING = pulsing green, UPCOMING = steady blue
        let boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
        let eventBorderColor = borderColor;
        let animationClass = '';
        
        if (hasOngoingEvent) {
          // ONGOING: Strong pulsing green glow
          boxShadow = '0 0 0 8px rgba(16, 185, 129, 0.9), 0 0 30px 6px rgba(16, 185, 129, 0.8), 0 4px 12px rgba(0, 0, 0, 0.4)';
          eventBorderColor = '#10b981';
          animationClass = 'ongoing-event-pulse';
        } else if (hasEvents) {
          // UPCOMING: Steady blue glow
          boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.8), 0 0 20px 4px rgba(59, 130, 246, 0.6), 0 4px 8px rgba(0, 0, 0, 0.3)';
          eventBorderColor = '#3b82f6';
        }
        
        // Create teardrop-shaped custom icon with enhanced visibility for events
        const customIcon = L.divIcon({
          html: `
            <div class="location-marker ${animationClass}" style="
              background: ${baseColor}; 
              width: ${markerSize}px; 
              height: ${markerSize}px; 
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex; 
              align-items: center; 
              justify-content: center; 
              box-shadow: ${boxShadow};
              border: ${hasEvents ? 5 : 4}px solid ${eventBorderColor};
              cursor: pointer;
              transition: all 0.3s ease;
            ">
              <span style="
                transform: rotate(45deg);
                font-size: ${iconSize}px;
              ">${emoji}</span>
            </div>
          `,
          iconSize: [markerSize + 4, markerSize + 4],
          iconAnchor: [(markerSize + 4) / 2, (markerSize + 4) / 2],
          className: 'custom-leaflet-marker'
        });

        const marker = L.marker([location.coordinates.lat, location.coordinates.lng], {
          icon: customIcon
        });

        // Build events HTML
        let eventsHTML = '';
        if (locationEvents.length > 0) {
          eventsHTML = `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              <h4 style="font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 8px 0;">📅 Events at this Location (${locationEvents.length})</h4>
              ${locationEvents.slice(0, 3).map(event => {
                const eventStatus = EventService.getEventStatus(event);
                const statusColor = eventStatus === 'ongoing' ? '#10b981' : '#3b82f6';
                const statusLabel = eventStatus === 'ongoing' ? 'LIVE NOW' : 'UPCOMING';
                return `
                  <div style="margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${statusColor};">
                    <div style="font-size: 12px; font-weight: 600; color: #111827; margin-bottom: 2px;">${event.title}</div>
                    <div style="font-size: 11px; color: #6b7280;">
                      <span style="color: ${statusColor}; font-weight: 600;">${statusLabel}</span> • 
                      ${new Date(event.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      at ${new Date(event.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                `;
              }).join('')}
              ${locationEvents.length > 3 ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px;">+${locationEvents.length - 3} more event${locationEvents.length - 3 > 1 ? 's' : ''}</div>` : ''}
            </div>
          `;
        }

        // Add popup with improved styling
        marker.bindPopup(`
          <div style="padding: 12px; min-width: 200px; font-family: Inter, sans-serif;">
            <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">${location.name}</h3>
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; line-height: 1.4;">${location.description || 'No description available'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${location.type}</span>
              ${location.floor ? 
                `<span style="font-size: 12px; color: #6b7280;">Floor: ${location.floor}</span>` : ''}
            </div>
            ${eventsHTML}
          </div>
        `, {
          closeButton: true,
          maxWidth: 300
        });

        // Add click handler
        marker.on('click', () => {
          if (routingMode) {
            const targetToFill: RouteTarget =
              !routePoints.start ? 'start' : !routePoints.destination ? 'destination' : activeRouteTarget;
            setRoutePoint(
              targetToFill,
              L.latLng(location.coordinates.lat, location.coordinates.lng),
              location.name
            );
          }
          handleLocationSelect(location);
        });

        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
      }
    });

    // Add event markers (if provided)
    if (showEvents && Array.isArray(events) && events.length > 0) {
      // Filter to show only upcoming and ongoing events (exclude completed and cancelled)
      const activeEvents = events.filter(event => {
        if (event.status === 'cancelled') return false;
        const status = EventService.getEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      });
      
      // Clear existing event markers
      eventMarkersRef.current.forEach(marker => {
        mapInstanceRef.current?.removeLayer(marker);
      });
      eventMarkersRef.current = [];

      activeEvents.forEach((event: Event) => {
        // Get coordinates from event's location
        let coords: Location['coordinates'] | undefined;
        
        // Check if locationId is populated as a Location object
        if (event.locationId && typeof event.locationId === 'object' && 'coordinates' in event.locationId) {
          coords = event.locationId.coordinates;
        }
        
        if (!coords) return; // Skip if no valid coordinates

        // Create custom icon for events (different from locations)
        const eventIcon = L.divIcon({
          html: `
            <div style="
              background: linear-gradient(135deg, #ec4899, #8b5cf6); 
              border-radius: 50%; 
              width: 38px; 
              height: 38px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border: 3px solid white; 
              font-size: 20px;
              box-shadow: 0 3px 8px rgba(236, 72, 153, 0.4);
              cursor: pointer;
              transition: transform 0.2s;
            " 
            onmouseover="this.style.transform='scale(1.1)'"
            onmouseout="this.style.transform='scale(1)'">�</div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -19],
          className: 'custom-event-marker'
        });

        const marker = L.marker([coords.lat, coords.lng], { icon: eventIcon });

        // Format date/time
        const eventDate = new Date(event.dateTime);
        const formattedDate = eventDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedTime = eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        // Calculate available spots
        const registeredCount = event.attendees?.length || 0;
        const availableSpots = event.capacity - registeredCount;
        const isFull = availableSpots <= 0;

        // Create enhanced popup
        marker.bindPopup(`
          <div style="padding: 14px; min-width: 220px; max-width: 280px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
              <span style="font-size: 22px;">🎉</span>
              <h3 style="font-size: 16px; font-weight: 700; margin: 0; color: #1f2937; flex: 1;">${event.title}</h3>
            </div>
            
            <p style="font-size: 13px; color: #4b5563; margin: 0 0 12px 0; line-height: 1.5;">${event.description || 'No description available'}</p>
            
            <div style="background: #f3f4f6; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <span style="font-size: 14px;">📅</span>
                <span style="font-size: 13px; color: #374151; font-weight: 500;">${formattedDate}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px;">⏰</span>
                <span style="font-size: 13px; color: #374151; font-weight: 500;">${formattedTime}</span>
              </div>
            </div>
            
            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
              <span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${event.category}</span>
              ${isFull ? 
                '<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">FULL</span>' :
                `<span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600;">${availableSpots} spots left</span>`
              }
            </div>
            
            ${typeof event.locationId === 'object' && event.locationId.name ? 
              `<div style="font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
                <span>📍</span>
                <span>${event.locationId.name}</span>
              </div>` : ''
            }
          </div>
        `, {
          closeButton: true,
          maxWidth: 280,
          className: 'event-popup'
        });

        // Add click handler for event selection
        if (onEventSelect) {
          marker.on('click', () => {
            if (routingMode) {
              const targetToFill: RouteTarget =
                !routePoints.start ? 'start' : !routePoints.destination ? 'destination' : activeRouteTarget;
              setRoutePoint(targetToFill, L.latLng(coords.lat, coords.lng), event.title);
            }
            onEventSelect(event);
          });
        }

        marker.addTo(mapInstanceRef.current!);
        eventMarkersRef.current.push(marker);
      });
    }
  }, [filteredLocations, events, handleLocationSelect, onEventSelect, showEvents, routingMode, routePoints.start, routePoints.destination, activeRouteTarget, setRoutePoint]);

  // Handle selected location
  useEffect(() => {
    if (selectedLocation && selectedLocation.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [selectedLocation.coordinates.lat, selectedLocation.coordinates.lng],
        18
      );
    }
  }, [selectedLocation]);

  // Change map style (unused for now, kept for future feature)
  // Commented out to avoid unused variable warnings
  /*
  const changeMapStyle = (style: 'default' | 'satellite' | 'dark' | 'terrain') => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    let tileConfig = MAP_CONFIG.tileLayer;
    if (style !== 'default') {
      tileConfig = MAP_CONFIG.alternativeTiles[style];
    }

    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: MAP_CONFIG.maxZoom,
      minZoom: MAP_CONFIG.minZoom
    });

    tileLayer.addTo(mapInstanceRef.current);
    setMapStyle(style);
  };
  */

  // Helper function to get turn icon from instruction text
  const getTurnIcon = (instruction: string): string => {
    const lower = instruction.toLowerCase();
    if (lower.includes('left')) return '⬅️';
    if (lower.includes('right')) return '➡️';
    if (lower.includes('arrive') || lower.includes('destination')) return '🏁';
    if (lower.includes('continue') || lower.includes('straight')) return '⬆️';
    return '🧭';
  };

  // Reset step index when route changes
  useEffect(() => {
    if (routeInfo) {
      setCurrentStepIndex(0);
    }
  }, [routeInfo]);

  return (
    <div className={`relative ${className}`}>
      {/* Enhanced Navigation Bar with Inline Directions */}
      {enableRouting && routingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl shadow-2xl backdrop-blur-md max-w-2xl w-full mx-4" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)'
        }}>
          <div className="px-4 py-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Route Planner</p>
                  <p className="text-xs text-white/80">
                    Choose a slot, then click a map point or any marker.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSwapRoute}
                    disabled={!routePoints.start || !routePoints.destination}
                    className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Swap start and destination"
                  >
                    Swap
                  </button>
                  <button
                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                    title="Clear route"
                    aria-label="Clear current route"
                    onClick={handleClearRoute}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {([
                  {
                    key: 'start' as RouteTarget,
                    title: 'Start',
                    icon: 'A',
                    color: 'from-emerald-400 to-emerald-500',
                    value: routePointLabels.start || 'Select starting point'
                  },
                  {
                    key: 'destination' as RouteTarget,
                    title: 'Destination',
                    icon: 'B',
                    color: 'from-rose-400 to-rose-500',
                    value: routePointLabels.destination || 'Select destination'
                  }
                ]).map((slot) => {
                  const isActive = activeRouteTarget === slot.key;
                  return (
                    <button
                      key={slot.key}
                      onClick={() => setActiveRouteTarget(slot.key)}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        isActive
                          ? 'border-white bg-white/20 shadow-lg'
                          : 'border-white/20 bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r ${slot.color} text-sm font-bold text-white shadow-sm`}>
                          {slot.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{slot.title}</p>
                          <p className="truncate text-sm font-medium text-white">{slot.value}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!routePoints.start && (
              <p className="mt-3 text-sm font-medium text-white text-center">
                Click anywhere on the map or choose a marker to set your starting point.
              </p>
            )}

            {routePoints.start && !routePoints.destination && (
              <p className="mt-3 text-sm font-medium text-white text-center">
                Now choose the destination by clicking the map or a marker.
              </p>
            )}

            {routePoints.start && routePoints.destination && !routeInfo && (
              <p className="text-sm font-medium text-white text-center">
                ⏳ Calculating route...
              </p>
            )}
            
            {/* Route found - show inline directions */}
            {routePoints.start && routePoints.destination && routeInfo && (
              <div className="mt-3 space-y-2">
                {/* Route Summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <span className="text-lg">🧭</span>
                    <span className="font-semibold text-sm">
                      {routeInfo.distance} • {routeInfo.time}
                    </span>
                    {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        Step {currentStepIndex + 1} of {routeInfo.instructions.length}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Current Turn Instruction */}
                {routeInfo.instructions && routeInfo.instructions.length > 0 && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                    <span className="text-2xl flex-shrink-0">
                      {getTurnIcon(routeInfo.instructions[currentStepIndex])}
                    </span>
                    <p className="text-sm text-white font-medium flex-1 truncate">
                      {routeInfo.instructions[currentStepIndex]}
                    </p>
                    {routeInfo.instructions.length > 1 && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                          disabled={currentStepIndex === 0}
                          className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Previous step"
                          aria-label="Previous navigation step"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCurrentStepIndex(Math.min(routeInfo.instructions.length - 1, currentStepIndex + 1))}
                          disabled={currentStepIndex === routeInfo.instructions.length - 1}
                          className="text-white/80 hover:text-white hover:bg-white/20 rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Next step"
                          aria-label="Next navigation step"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* Search Results Counter with Accessibility */}
    <div 
      className={`absolute top-4 z-[1000] rounded-lg shadow-xl px-3 py-2 ${
        enableRouting ? 'right-4' : 'left-4'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(59, 130, 246, 0.95))',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(10px)'
      }}
      role="status"
      aria-live="polite"
      aria-label={`Search results: ${(Array.isArray(filteredLocations) ? filteredLocations.length : 0)} locations and ${(Array.isArray(events) ? events.filter(event => {
        if (event.status === 'cancelled') return false;
        const status = EventService.getEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      }).length : 0)} events found`}
    >
        <span className="text-sm font-semibold text-white">
      {(Array.isArray(filteredLocations) ? filteredLocations.length : 0)} location{(Array.isArray(filteredLocations) ? filteredLocations.length : 0) !== 1 ? 's' : ''} • {(Array.isArray(events) ? events.filter(event => {
        if (event.status === 'cancelled') return false;
        const status = EventService.getEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      }).length : 0)} event{(Array.isArray(events) ? events.filter(event => {
        if (event.status === 'cancelled') return false;
        const status = EventService.getEventStatus(event);
        return status === 'upcoming' || status === 'ongoing';
      }).length : 0) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Loading State with Accessibility */}
      {!isMapLoaded && !mapError && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-[2000]"
          style={{
            background: 'linear-gradient(135deg, #fffef7 0%, #fffcf5 50%, #fffbf0 100%)'
          }}
          role="status"
          aria-live="polite"
          aria-label="Loading campus map"
        >
          <div className="text-center">
            <div 
              className="animate-spin rounded-full h-8 w-8 mx-auto mb-2"
              style={{
                border: '3px solid transparent',
                borderTop: '3px solid #10b981',
                borderRight: '3px solid #3b82f6'
              }}
              aria-hidden="true"
            />
            <p className="font-medium text-sm" style={{
              background: 'linear-gradient(90deg, #10b981, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Loading campus map...</p>
          </div>
        </div>
      )}

      {/* Error State with Accessibility */}
      {mapError && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-[2000]"
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
          }}
          role="alert"
          aria-live="assertive"
          aria-label={`Map error: ${mapError}`}
        >
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2" aria-hidden="true">⚠️</div>
            <p className="text-red-600 text-sm">{mapError}</p>
          </div>
        </div>
      )}

      {/* Map Container with Accessibility */}
      <div 
        key="map-v7-large-bounds-final"
        ref={mapRef} 
        className="w-full h-full overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #fffef7 0%, #fffcf5 50%, #fffbf0 100%)',
          minHeight: '500px',
          position: 'relative'
        }}
        role="img"
        aria-label="Interactive campus map showing locations and events"
        tabIndex={0}
        onKeyDown={(e) => {
          // Allow map to receive focus for keyboard navigation
          if (e.key === 'Enter') {
            e.preventDefault();
            mapRef.current?.focus();
          }
        }}
      />
    </div>
  );
});

LeafletMap.displayName = 'LeafletMap';

export default LeafletMap;
