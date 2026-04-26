import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Leaflet for testing
(global as any).L = {
  map: vi.fn(() => ({
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn().mockReturnThis(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
  })),
  popup: vi.fn(() => ({
    setLatLng: vi.fn().mockReturnThis(),
    setContent: vi.fn().mockReturnThis(),
    openOn: vi.fn().mockReturnThis(),
  })),
  Icon: {
    Default: {
      mergeOptions: vi.fn(),
    },
  },
};

// Mock CSS imports
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
(global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
