import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAnalytics, trackPageView, trackVerificationResult, _resetForTesting, _wasScriptInjected } from './analytics.js';

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

  describe('trackVerificationResult', () => {
    it('does nothing when analytics not initialized', () => {
      trackVerificationResult('valid');
      expect(globalThis.gtag).toBeUndefined();
    });

    it('sends verification_result event with outcome', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      const spy = vi.spyOn(globalThis, 'gtag');

      trackVerificationResult('valid');
      expect(spy).toHaveBeenCalledWith('event', 'verification_result', { outcome: 'valid' });
    });

    it('tracks all outcome types correctly', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      const spy = vi.spyOn(globalThis, 'gtag');

      const outcomes = ['valid', 'invalid_signature', 'invalid_expired', 'invalid_revoked', 'invalid_no_token', 'invalid_config_error'];
      outcomes.forEach(outcome => {
        trackVerificationResult(outcome);
        expect(spy).toHaveBeenCalledWith('event', 'verification_result', { outcome });
      });
    });

    it('does not include any PII in tracked events', () => {
      initAnalytics({ analytics: { enabled: true, measurementId: 'G-TEST123' } });
      const spy = vi.spyOn(globalThis, 'gtag');

      trackVerificationResult('valid');

      const call = spy.mock.calls.find(c => c[0] === 'event' && c[1] === 'verification_result');
      const params = call[2];
      expect(Object.keys(params)).toEqual(['outcome']);
    });
  });
});
