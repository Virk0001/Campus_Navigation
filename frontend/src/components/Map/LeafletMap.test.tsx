import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeafletMap } from './LeafletMap';
import type { Location } from '../../types';

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => { throw new Error('Map initialization failed'); }),
    tileLayer: vi.fn(),
    marker: vi.fn(),
    popup: vi.fn(),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  },
}));

// Mock leaflet CSS
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('LeafletMap Component', () => {
  const mockLocations: Location[] = [
    {
      _id: '1',
      name: 'Test Location 1',
      description: 'A test location',
      type: 'hostel',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('renders without crashing', () => {
    render(<LeafletMap locations={[]} />);
    expect(screen.getByText(/failed to load map/i)).toBeInTheDocument();
  });

  it('renders with locations', () => {
    render(<LeafletMap locations={mockLocations} />);
    expect(screen.getByText(/failed to load map/i)).toBeInTheDocument();
  });

  it('shows location count when locations provided', () => {
    render(<LeafletMap locations={mockLocations} />);
    expect(screen.getByText(/1 location/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-map-class';
    const { container } = render(<LeafletMap locations={[]} className={customClass} />);
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('shows error state when map fails to initialize', () => {
    render(<LeafletMap locations={[]} />);
    expect(screen.getByText(/failed to load map/i)).toBeInTheDocument();
  });
});
