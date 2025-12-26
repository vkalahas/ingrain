import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, IngrainSettings } from '../src/settings';

describe('Settings', () => {
	describe('DEFAULT_SETTINGS', () => {
		it('should have empty API key by default', () => {
			expect(DEFAULT_SETTINGS.apiKey).toBe('');
		});

		it('should be a valid IngrainSettings object', () => {
			expect(DEFAULT_SETTINGS).toHaveProperty('apiKey');
			expect(typeof DEFAULT_SETTINGS.apiKey).toBe('string');
		});
	});

	describe('IngrainSettings interface', () => {
		it('should accept valid API key', () => {
			const settings: IngrainSettings = {
				apiKey: 'sk-test-key-123',
			};

			expect(settings.apiKey).toBe('sk-test-key-123');
		});

		it('should allow spreading DEFAULT_SETTINGS', () => {
			const customSettings: IngrainSettings = {
				...DEFAULT_SETTINGS,
				apiKey: 'custom-key',
			};

			expect(customSettings.apiKey).toBe('custom-key');
		});

		it('should handle empty API key', () => {
			const settings: IngrainSettings = {
				apiKey: '',
			};

			expect(settings.apiKey).toBe('');
			expect(settings.apiKey.length).toBe(0);
		});
	});
});

