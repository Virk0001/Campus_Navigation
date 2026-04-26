/**
 * OrganizerDashboard - Event management dashboard for organizers
 * Shows events created by the organizer with edit/delete controls
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EventService } from '../services/eventService';
import { useAuthStore } from '../stores/authStore';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const OrganizerDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed' | 'canceled'>('upcoming');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EventService.getMyEvents();
      
      // Guard against unexpected response structure
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        console.warn('Unexpected response structure from getMyEvents:', data);
        setEvents([]);
        setError('Received invalid data format from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]); // Reset to empty array on error
      console.error('Failed to load organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(eventId);
      await EventService.deleteEvent(eventId);
      setEvents(events.filter(e => e._id !== eventId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
      console.error('Failed to delete event:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this event? Attendees will be notified.')) {
      return;
    }

    try {
      setDeletingId(eventId); // Reuse deletingId for loading state
      const cancelledEvent = await EventService.cancelEvent(eventId);
      
      // Update the event in the list with the cancelled status
      setEvents(prevEvents => 
        prevEvents.map(e => e._id === eventId ? cancelledEvent : e)
      );
    } catch (err) {
      console.error('Failed to cancel event:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (eventId: string) => {
    navigate(`/events/${eventId}/edit`);
  };

  // Calculate statistics
  // Exclude cancelled events from time-based status counts
  const upcomingEvents = events.filter(e => e.status !== 'cancelled' && EventService.getEventStatus(e) === 'upcoming');
  const ongoingEvents = events.filter(e => e.status !== 'cancelled' && EventService.getEventStatus(e) === 'ongoing');
  const completedEvents = events.filter(e => e.status !== 'cancelled' && EventService.getEventStatus(e) === 'completed');
  const canceledEvents = events.filter(e => e.status === 'cancelled');
  const totalRegistrations = events.reduce((sum, e) => sum + (e.attendees?.length || 0), 0);

  // Filter and sort events based on active filter
  const filteredAndSortedEvents = useMemo(() => {
    let filtered: Event[] = [];
    
    switch(activeFilter) {
      case 'upcoming':
        filtered = upcomingEvents;
        break;
      case 'ongoing':
        filtered = ongoingEvents;
        break;
      case 'completed':
        filtered = completedEvents;
        break;
      case 'canceled':
        filtered = canceledEvents;
        break;
      case 'all':
      default:
        // When showing 'all', exclude cancelled events (they have their own filter)
        filtered = events.filter(e => e.status !== 'cancelled');
        break;
    }
    
    // Sort: upcoming by earliest first, completed/canceled by latest first
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return activeFilter === 'upcoming' || activeFilter === 'ongoing' ? dateA - dateB : dateB - dateA;
    });
  }, [events, activeFilter, upcomingEvents, ongoingEvents, completedEvents, canceledEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--background-cream)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold main-heading">Organizer Dashboard</h1>
              <p className="mt-3 text-gray-700 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Welcome back, {user?.name}! Manage your events here.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/map"
                className="btn btn-outline"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Go to Map
              </Link>
              <Link
                to="/events/create"
                className="btn btn-primary"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {/* Upcoming Events */}
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`card !p-6 text-left ${
              activeFilter === 'upcoming' ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              </div>
            </div>
          </button>

          {/* Ongoing Events */}
          <button
            onClick={() => setActiveFilter('ongoing')}
            className={`card !p-6 text-left ${
              activeFilter === 'ongoing' ? 'ring-2 ring-blue-500 shadow-lg' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ongoing Events</p>
                <p className="text-2xl font-bold text-gray-900">{ongoingEvents.length}</p>
              </div>
            </div>
          </button>

          {/* Total Registrations - Not clickable, just a stat display */}
          <div className="card !p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-100 rounded-md p-3">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
              </div>
            </div>
          </div>

          {/* Completed Events */}
          <button
            onClick={() => setActiveFilter('completed')}
            className={`card !p-6 text-left ${
              activeFilter === 'completed' ? 'ring-2 ring-gray-500 shadow-lg' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Events</p>
                <p className="text-2xl font-bold text-gray-900">{completedEvents.length}</p>
              </div>
            </div>
          </button>

          {/* Canceled Events */}
          <button
            onClick={() => setActiveFilter('canceled')}
            className={`card !p-6 text-left ${
              activeFilter === 'canceled' ? 'ring-2 ring-gray-400 shadow-lg' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Canceled Events</p>
                <p className="text-2xl font-bold text-gray-900">{canceledEvents.length}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="card !p-0 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200" style={{ backgroundColor: 'var(--background-cream)' }}>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {activeFilter === 'all' && 'All Events'}
              {activeFilter === 'upcoming' && 'Upcoming Events'}
              {activeFilter === 'ongoing' && 'Ongoing Events'}
              {activeFilter === 'completed' && 'Completed Events'}
              {activeFilter === 'canceled' && 'Canceled Events'}
            </h2>
          </div>

          {filteredAndSortedEvents.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {activeFilter === 'upcoming' && 'No upcoming events'}
                {activeFilter === 'ongoing' && 'No ongoing events'}
                {activeFilter === 'completed' && 'No completed events'}
                {activeFilter === 'canceled' && 'No canceled events'}
                {activeFilter === 'all' && events.length === 0 && 'No events yet'}
                {activeFilter === 'all' && events.length > 0 && 'No events in this category'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeFilter === 'upcoming' && 'Create a new event to see it here.'}
                {activeFilter === 'completed' && 'Past events will appear here.'}
                {activeFilter === 'canceled' && 'Canceled events will appear here.'}
                {activeFilter === 'all' && events.length === 0 && 'Get started by creating your first event.'}
                {activeFilter === 'all' && events.length > 0 && 'Try selecting a different filter.'}
              </p>
              {events.length === 0 && (
                <div className="mt-6">
                  <Link
                    to="/events/create"
                    className="btn btn-primary"
                  >
                    <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Event
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedEvents.map(event => {
                const { date, timeRange } = EventService.formatEventDateTime(event);
                const status = EventService.getEventStatus(event);
                const availableSpots = EventService.getAvailableSpots(event);

                return (
                  <div key={event._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                          
                          {/* Event Status Badge */}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === 'published' ? 'bg-green-100 text-green-800' :
                            event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                          </span>
                          
                          {/* Time-based Status Badge - only show for non-cancelled events */}
                          {event.status !== 'cancelled' && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                              status === 'ongoing' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          )}
                          
                          {/* Category Badge */}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {event.category}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {date}
                          </div>
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeRange}
                          </div>
                          <div className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {event.attendees.length} / {event.capacity} registered
                            {availableSpots === 0 && <span className="ml-1 text-red-600 font-medium">(Full)</span>}
                          </div>
                        </div>
                      </div>

                      <div className="ml-6 flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(event._id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          title="Edit event"
                        >
                          <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        
                        {/* Cancel button - only for upcoming events that aren't already cancelled */}
                        {status === 'upcoming' && event.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(event._id)}
                            disabled={deletingId === event._id}
                            className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Cancel event"
                          >
                            {deletingId === event._id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </>
                            )}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(event._id)}
                          disabled={deletingId === event._id}
                          className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Delete event"
                        >
                          {deletingId === event._id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
