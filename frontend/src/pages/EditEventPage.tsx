/**
 * EditEventPage - Page for editing existing events
 * Protected by OrganizerRoute (organizer and admin roles only)
 * Additional check: Only creator or admin can edit
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Event, EventFormData } from '../types';
import { EventService } from '../services/eventService';
import EventForm from '../components/EventForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';

const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) {
      setError('Event ID is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const eventData = await EventService.getEventById(id);
      
      // Check ownership: Only creator or admin can edit
      const creatorId = typeof eventData.createdBy === 'string' 
        ? eventData.createdBy 
        : eventData.createdBy?._id;
      
      // Compare with user's UID (Firebase UID is used as createdBy in events)
      if (user?.role !== 'admin' && creatorId !== user?.uid) {
        setError('You do not have permission to edit this event');
        setLoading(false);
        return;
      }

      setEvent(eventData);
    } catch (error) {
      console.error('Failed to load event:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: EventFormData) => {
    if (!id) return;

    try {
      await EventService.updateEvent(id, data);
      alert('Event updated successfully!');
      // Redirect based on user role
      const dashboardRoute = user?.role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard';
      navigate(dashboardRoute);
    } catch (error) {
      console.error('Failed to update event:', error);
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to update event. Please try again.';
      alert(message);
      throw error; // Re-throw to prevent form from resetting
    }
  };

  const handleCancel = () => {
    // Redirect based on user role
    const dashboardRoute = user?.role === 'admin' ? '/admin/dashboard' : '/organizer/dashboard';
    navigate(dashboardRoute);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-cream)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--background-cream)', fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-red-50 border border-red-200">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-red-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-900">Error Loading Event</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="btn btn-outline mt-4 !bg-red-100 !text-red-800 hover:!bg-red-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--background-cream)', fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-yellow-50 border border-yellow-200">
            <p className="text-yellow-800">Event not found</p>
            <button
              onClick={handleCancel}
              className="btn btn-outline mt-4 !bg-yellow-100 !text-yellow-800 hover:!bg-yellow-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: 'var(--background-cream)', fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="mb-4 text-base font-semibold text-gray-700 flex items-center transition-colors"
            style={{ fontFamily: 'Poppins, sans-serif' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-green)'}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold main-heading">✏️ Edit Event</h1>
          <p className="mt-2 text-base text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Update the event details below. All fields marked with * are required.
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <EventForm
            initialData={event}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;
