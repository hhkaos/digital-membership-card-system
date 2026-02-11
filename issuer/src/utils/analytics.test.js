import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAnalytics, trackPageView, _resetForTesting } from './analytics.js';

describe('analytics', () => {
  beforeEach(() => {
    _resetForTesting();
  });

  describe('initAnalytics', () => {
    it('does not initialize when enabled is false', () => {
      initAnalytics({ analytics: { enabled: false, measurementId: 'G-TEST123' } });
      expect(globalThis.gtag).toBeUndefined();
    });

    it('does not initialize when analytics config is missing', () => {
      initAnalytics({});
      expect(globalThis.gtag).toBeUndefined();
    });

    it('does not initialize when measurementId is empty', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: '' } });
      expect(globalThis.gtag).toBeUndefined();
    });

    it('initializes gtag when enabled with valid measurementId', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      expect(typeof globalThis.gtag).toBe('function');
      expect(Array.isArray(globalThis.dataLayer)).toBe(true);
    });

    it('configures GA4 with IP anonymization and no auto page view', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });

      const configCall = globalThis.dataLayer.find(
        args => args[0] === 'config' && args[1] === 'G-TEST123'
      );
      expect(configCall).toBeDefined();
      expect(configCall[2]).toEqual({ anonymize_ip: true, send_page_view: false });
    });

    it('does not initialize twice', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      const firstDataLayerLength = globalThis.dataLayer.length;

      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      expect(globalThis.dataLayer.length).toBe(firstDataLayerLength);
    });
  });

  describe('trackPageView', () => {
    it('does nothing when analytics not initialized', () => {
      trackPageView();
      expect(globalThis.gtag).toBeUndefined();
    });

    it('sends page_view event when initialized', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      const spy = vi.spyOn(globalThis, 'gtag');

      trackPageView();
      expect(spy).toHaveBeenCalledWith('event', 'page_view');
    });
  });
});
