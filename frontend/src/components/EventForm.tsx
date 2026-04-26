/**
 * EventForm - Shared form component for creating and editing events
 * Used by both CreateEventPage and EditEventPage
 */

import { useState, useEffect } from 'react';
import { Event, EventFormData, EventCategory, EventStatus, Location } from '../types';
import { LocationService } from '../services/locationService';
import LoadingSpinner from './LoadingSpinner';

interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'seminar', label: 'Seminar' },
  { value: 'conference', label: 'Conference' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' }
];

const EventForm: React.FC<EventFormProps> = ({ initialData, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || 'academic',
    locationId: typeof initialData?.locationId === 'string' ? initialData.locationId : initialData?.locationId?._id || '',
    dateTime: initialData?.dateTime ? new Date(initialData.dateTime).toISOString().slice(0, 16) : '',
    endDateTime: initialData?.endDateTime ? new Date(initialData.endDateTime).toISOString().slice(0, 16) : '',
    capacity: initialData?.capacity || 50,
    organizer: initialData?.organizer || '',
    tags: initialData?.tags || [],
    status: initialData?.status || 'published'
  });

  const [tagInput, setTagInput] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await LocationService.getLocations({ limit: 100 });
      setLocations(response.locations);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    if (!formData.locationId) {
      newErrors.locationId = 'Location is required';
    }

    if (!formData.dateTime) {
      newErrors.dateTime = 'Date and time is required';
    } else {
      const selectedDate = new Date(formData.dateTime);
      if (selectedDate <= new Date()) {
        newErrors.dateTime = 'Event date must be in the future';
      }
    }

    if (!formData.endDateTime) {
      newErrors.endDateTime = 'End date and time is required';
    } else if (formData.dateTime) {
      const startDate = new Date(formData.dateTime);
      const endDate = new Date(formData.endDateTime);
      if (endDate <= startDate) {
        newErrors.endDateTime = 'End time must be after start time';
      }
    }

    if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (!formData.organizer.trim()) {
      newErrors.organizer = 'Organizer name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-base font-semibold text-gray-800 mb-2">
          Event Title *
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`input text-base ${
            errors.title ? 'input-error' : ''
          }`}
          placeholder="Enter event title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-base font-semibold text-gray-800 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={`input text-base ${
            errors.description ? 'input-error' : ''
          }`}
          placeholder="Describe your event..."
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>

      {/* Category and Status Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-base font-semibold text-gray-800 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
            className="input text-base"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        {isEdit && (
          <div>
            <label htmlFor="status" className="block text-base font-semibold text-gray-800 mb-2">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
              className="input text-base"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="locationId" className="block text-base font-semibold text-gray-800 mb-2">
          Location *
        </label>
        {loadingLocations ? (
          <div className="mt-1 flex items-center space-x-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600">Loading locations...</span>
          </div>
        ) : (
          <select
            id="locationId"
            value={formData.locationId}
            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
            className={`input text-base ${
              errors.locationId ? 'input-error' : ''
            }`}
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location._id} value={location._id}>
                {location.name} - {location.type}
              </option>
            ))}
          </select>
        )}
        {errors.locationId && <p className="mt-1 text-sm text-red-600">{errors.locationId}</p>}
      </div>

      {/* Date & Time and Capacity Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Start Date & Time */}
        <div>
          <label htmlFor="dateTime" className="block text-base font-semibold text-gray-800 mb-2">
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            id="dateTime"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className={`input text-base ${
              errors.dateTime ? 'input-error' : ''
            }`}
          />
          {errors.dateTime && <p className="mt-1 text-sm text-red-600">{errors.dateTime}</p>}
        </div>

        {/* End Date & Time */}
        <div>
          <label htmlFor="endDateTime" className="block text-base font-semibold text-gray-800 mb-2">
            End Date & Time *
          </label>
          <input
            type="datetime-local"
            id="endDateTime"
            value={formData.endDateTime}
            onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
            className={`input text-base ${
              errors.endDateTime ? 'input-error' : ''
            }`}
          />
          {errors.endDateTime && <p className="mt-1 text-sm text-red-600">{errors.endDateTime}</p>}
        </div>
      </div>

      {/* Organizer and Capacity Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Organizer moved here */}
        <div>
          <label htmlFor="organizer" className="block text-base font-semibold text-gray-800 mb-2">
            Organizer Name *
          </label>
          <input
            type="text"
            id="organizer"
            value={formData.organizer}
            onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
            placeholder="Enter organizer name"
            className={`input text-base ${
              errors.organizer ? 'input-error' : ''
            }`}
          />
          {errors.organizer && <p className="mt-1 text-sm text-red-600">{errors.organizer}</p>}
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block text-base font-semibold text-gray-800 mb-2">
            Capacity *
          </label>
          <input
            type="number"
            id="capacity"
            min="1"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            className={`input text-base ${
              errors.capacity ? 'input-error' : ''
            }`}
          />
          {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-base font-semibold text-gray-800 mb-2">
          Tags (Optional)
        </label>
        <div className="mt-1">
          <div className="flex space-x-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input text-base"
              placeholder="Add tags (press Enter)"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-outline !py-2"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 hover:bg-green-300 focus:outline-none"
                  >
                    <span className="text-green-800">×</span>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary flex items-center"
        >
          {submitting && <LoadingSpinner size="sm" className="mr-2" />}
          {isEdit ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
