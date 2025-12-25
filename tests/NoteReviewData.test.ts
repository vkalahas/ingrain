import { describe, it, expect } from 'vitest';
import { DEFAULT_DATA, DEFAULT_NOTE_DATA, PluginData, NoteReviewData } from '../src/NoteReviewData';

describe('NoteReviewData', () => {
	describe('DEFAULT_NOTE_DATA', () => {
		it('should have correct default values', () => {
			expect(DEFAULT_NOTE_DATA.ease).toBe(200);
			expect(DEFAULT_NOTE_DATA.lastReviewed).toBe(0);
			expect(DEFAULT_NOTE_DATA.lastSeen).toBe(0);
		});

		it('should be a valid NoteReviewData object', () => {
			expect(DEFAULT_NOTE_DATA).toHaveProperty('ease');
			expect(DEFAULT_NOTE_DATA).toHaveProperty('lastReviewed');
			expect(DEFAULT_NOTE_DATA).toHaveProperty('lastSeen');
		});

		it('should have ease value in reasonable range', () => {
			expect(DEFAULT_NOTE_DATA.ease).toBeGreaterThanOrEqual(130);
			expect(DEFAULT_NOTE_DATA.ease).toBeLessThanOrEqual(250);
		});
	});

	describe('DEFAULT_DATA', () => {
		it('should have empty notes object', () => {
			expect(DEFAULT_DATA.notes).toEqual({});
			expect(Object.keys(DEFAULT_DATA.notes)).toHaveLength(0);
		});

		it('should be a valid PluginData object', () => {
			expect(DEFAULT_DATA).toHaveProperty('notes');
			expect(typeof DEFAULT_DATA.notes).toBe('object');
		});
	});

	describe('NoteReviewData interface', () => {
		it('should accept valid review data', () => {
			const validData: NoteReviewData = {
				ease: 180,
				lastReviewed: Date.now(),
				lastSeen: Date.now(),
			};

			expect(validData.ease).toBe(180);
			expect(validData.lastReviewed).toBeGreaterThan(0);
			expect(validData.lastSeen).toBeGreaterThan(0);
		});

		it('should allow spreading DEFAULT_NOTE_DATA', () => {
			const customData: NoteReviewData = {
				...DEFAULT_NOTE_DATA,
				ease: 150,
			};

			expect(customData.ease).toBe(150);
			expect(customData.lastReviewed).toBe(0);
			expect(customData.lastSeen).toBe(0);
		});
	});

	describe('PluginData interface', () => {
		it('should accept multiple notes', () => {
			const data: PluginData = {
				notes: {
					'note1.md': { ...DEFAULT_NOTE_DATA, ease: 150 },
					'note2.md': { ...DEFAULT_NOTE_DATA, ease: 200 },
					'folder/note3.md': { ...DEFAULT_NOTE_DATA, ease: 250 },
				}
			};

			expect(Object.keys(data.notes)).toHaveLength(3);
			expect(data.notes['note1.md'].ease).toBe(150);
			expect(data.notes['folder/note3.md'].ease).toBe(250);
		});

		it('should allow adding notes dynamically', () => {
			const data: PluginData = { ...DEFAULT_DATA };
			const notePath = 'test-note.md';
			
			data.notes[notePath] = { ...DEFAULT_NOTE_DATA };
			
			expect(data.notes[notePath]).toBeDefined();
			expect(data.notes[notePath].ease).toBe(200);
		});
	});
});

