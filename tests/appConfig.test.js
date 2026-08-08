import { describe, it, expect } from 'vitest';
import { APP_CONFIG } from '../src/config/appConfig.js';

describe('APP_CONFIG Central Theme & Color Helper', () => {
  it('should return the correct single-source-of-truth hex for category keys', () => {
    expect(APP_CONFIG.getHexColor('pastelMint')).toBe('#059669');
    expect(APP_CONFIG.getHexColor('pastelAmber')).toBe('#d97706');
    expect(APP_CONFIG.getHexColor('pastelLavender')).toBe('#7e22ce');
    expect(APP_CONFIG.getHexColor('pastelSky')).toBe('#0284c7');
    expect(APP_CONFIG.getHexColor('pastelRose')).toBe('#e11d48');
    expect(APP_CONFIG.getHexColor('pastelPink')).toBe('#db2777');
  });

  it('should return fallback hex when an unknown key is provided', () => {
    expect(APP_CONFIG.getHexColor('unknownKey', '#1e293b')).toBe('#1e293b');
  });
});
