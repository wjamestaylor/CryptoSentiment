import { renderHook } from '@testing-library/react';
import { 
  useMediaQuery, 
  useBreakpoint, 
  useIsMobile, 
  useIsTablet, 
  useIsDesktop,
  useScreenSize 
} from '@/hooks/use-media-query';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  const mockMediaQueryList = {
    matches,
    media: '',
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      ...mockMediaQueryList,
      media: query,
    })),
  });

  return mockMediaQueryList;
};

describe('Media Query Hooks', () => {
  beforeEach(() => {
    // Mock window.innerWidth and innerHeight
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  describe('useMediaQuery', () => {
    it('returns true when media query matches', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(true);
    });

    it('returns false when media query does not match', () => {
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      
      expect(result.current).toBe(false);
    });
  });

  describe('useBreakpoint', () => {
    it('returns true for md breakpoint when screen is large enough', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useBreakpoint('md'));
      
      expect(result.current).toBe(true);
    });

    it('returns false for lg breakpoint when screen is too small', () => {
      mockMatchMedia(false);
      
      const { result } = renderHook(() => useBreakpoint('lg'));
      
      expect(result.current).toBe(false);
    });
  });

  describe('useIsMobile', () => {
    it('returns true when screen is smaller than md breakpoint', () => {
      mockMatchMedia(false); // md breakpoint not matched
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(true);
    });

    it('returns false when screen is larger than md breakpoint', () => {
      mockMatchMedia(true); // md breakpoint matched
      
      const { result } = renderHook(() => useIsMobile());
      
      expect(result.current).toBe(false);
    });
  });

  describe('useIsTablet', () => {
    it('returns true when screen is between md and lg breakpoints', () => {
      // Reset call count for this test
      let callCount = 0;
      
      const mockMatchMediaForTablet = jest.fn().mockImplementation((query) => {
        const matches = query.includes('768px') ? true : false; // md matches, lg doesn't
        callCount++;
        
        return {
          matches,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMediaForTablet,
      });
      
      const { result } = renderHook(() => useIsTablet());
      
      expect(result.current).toBe(true);
    });
  });

  describe('useIsDesktop', () => {
    it('returns true when screen is larger than lg breakpoint', () => {
      mockMatchMedia(true);
      
      const { result } = renderHook(() => useIsDesktop());
      
      expect(result.current).toBe(true);
    });
  });

  describe('useScreenSize', () => {
    it('returns current screen dimensions', () => {
      const { result } = renderHook(() => useScreenSize());
      
      expect(result.current.width).toBe(1024);
      expect(result.current.height).toBe(768);
      expect(result.current.isDesktop).toBe(true);
    });

    it('correctly identifies mobile screen', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      const { result } = renderHook(() => useScreenSize());
      
      expect(result.current.width).toBe(375);
      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('correctly identifies tablet screen', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });
      
      const { result } = renderHook(() => useScreenSize());
      
      expect(result.current.width).toBe(800);
      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });
  });

  // Test event listeners
  describe('Event Listeners', () => {
    it('adds and removes resize event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      const { unmount } = renderHook(() => useScreenSize());
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});