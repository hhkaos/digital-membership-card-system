import fs from 'node:fs';
import { describe, expect, it } from 'vitest';

function readPngSize(filePath) {
  const data = fs.readFileSync(filePath);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  return { width, height };
}

describe('Phase 9 PWA setup', () => {
  it('has a valid manifest with required fields', () => {
    const manifestPath = new URL('../public/manifest.json', import.meta.url);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.start_url).toBe('/issuer/');
    expect(manifest.scope).toBe('/issuer/');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('ships required icon sizes (192x192 and 512x512)', () => {
    const icon192Path = new URL('../public/icons/icon-192x192.png', import.meta.url);
    const icon512Path = new URL('../public/icons/icon-512x512.png', import.meta.url);

    expect(fs.existsSync(icon192Path)).toBe(true);
    expect(fs.existsSync(icon512Path)).toBe(true);
    expect(readPngSize(icon192Path)).toEqual({ width: 192, height: 192 });
    expect(readPngSize(icon512Path)).toEqual({ width: 512, height: 512 });
  });

  it('registers a service worker from the app entrypoint', () => {
    const mainPath = new URL('./main.jsx', import.meta.url);
    const mainSource = fs.readFileSync(mainPath, 'utf8');

    expect(mainSource).toContain("virtual:pwa-register");
    expect(mainSource).toContain('registerSW(');
  });
});
