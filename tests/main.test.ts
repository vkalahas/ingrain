import { describe, it, expect, beforeEach, vi } from 'vitest';
import Ingrain from '../src/main';
import { TFile } from 'obsidian';
import { DEFAULT_NOTE_DATA } from '../src/NoteReviewData';

describe('Ingrain Plugin', () => {
	let plugin: Ingrain;

	beforeEach(() => {
		plugin = new Ingrain({} as any, {} as any);
		plugin.data = { notes: {} };
		plugin.notes = [];
	});

	describe('updateReview', () => {
		it('should update review data with ease and timestamp', () => {
			const filePath = 'test-note.md';
			const ease = 150;

			plugin.updateReview(filePath, ease);

			expect(plugin.data.notes[filePath]).toBeDefined();
			expect(plugin.data.notes[filePath].ease).toBe(ease);
			expect(plugin.data.notes[filePath].lastReviewed).toBeGreaterThan(0);
		});

		it('should create new entry if note does not exist', () => {
			const filePath = 'new-note.md';
			
			plugin.updateReview(filePath, 200);

			expect(plugin.data.notes[filePath]).toBeDefined();
			expect(plugin.data.notes[filePath].ease).toBe(200);
		});

		it('should update existing note data', () => {
			const filePath = 'existing-note.md';
			plugin.data.notes[filePath] = { ...DEFAULT_NOTE_DATA, ease: 130 };

			plugin.updateReview(filePath, 250);

			expect(plugin.data.notes[filePath].ease).toBe(250);
		});
	});

	describe('markAsReviewed', () => {
		it('should update both lastReviewed and lastSeen', () => {
			const filePath = 'test-note.md';
			const beforeTime = Date.now();

			plugin.markAsReviewed(filePath);
			
			const afterTime = Date.now();

			expect(plugin.data.notes[filePath]).toBeDefined();
			expect(plugin.data.notes[filePath].lastReviewed).toBeGreaterThanOrEqual(beforeTime);
			expect(plugin.data.notes[filePath].lastReviewed).toBeLessThanOrEqual(afterTime);
			expect(plugin.data.notes[filePath].lastSeen).toBeGreaterThanOrEqual(beforeTime);
			expect(plugin.data.notes[filePath].lastSeen).toBeLessThanOrEqual(afterTime);
		});

		it('should set same timestamp for both fields', () => {
			const filePath = 'test-note.md';

			plugin.markAsReviewed(filePath);

			expect(plugin.data.notes[filePath].lastReviewed).toBe(
				plugin.data.notes[filePath].lastSeen
			);
		});
	});

	describe('getOldestNote', () => {
		it('should return null when no notes exist', () => {
			const oldest = plugin.getOldestNote();
			expect(oldest).toBeNull();
		});

		it('should return the only note when one exists', () => {
			const note = new TFile('single-note.md');
			plugin.notes = [note];
			plugin.data.notes[note.path] = { ...DEFAULT_NOTE_DATA, lastSeen: Date.now() };

			const oldest = plugin.getOldestNote();

			expect(oldest).toBe(note);
		});

		it('should return note with oldest lastSeen timestamp', () => {
			const note1 = new TFile('note1.md');
			const note2 = new TFile('note2.md');
			const note3 = new TFile('note3.md');

			plugin.notes = [note1, note2, note3];
			plugin.data.notes[note1.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1000 };
			plugin.data.notes[note2.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 500 };  // Oldest
			plugin.data.notes[note3.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1500 };

			const oldest = plugin.getOldestNote();

			expect(oldest).toBe(note2);
		});

		it('should exclude notes in the exclude set', () => {
			const note1 = new TFile('note1.md');
			const note2 = new TFile('note2.md');
			const note3 = new TFile('note3.md');

			plugin.notes = [note1, note2, note3];
			plugin.data.notes[note1.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1000 };
			plugin.data.notes[note2.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 500 };  // Oldest but excluded
			plugin.data.notes[note3.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1500 };

			const excludePaths = new Set([note2.path]);
			const oldest = plugin.getOldestNote(excludePaths);

			expect(oldest).toBe(note1);
		});

		it('should treat notes without review data as oldest (lastSeen = 0)', () => {
			const note1 = new TFile('note1.md');
			const note2 = new TFile('note2.md');

			plugin.notes = [note1, note2];
			plugin.data.notes[note1.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1000 };
			// note2 has no review data, so lastSeen defaults to 0

			const oldest = plugin.getOldestNote();

			expect(oldest).toBe(note2);
		});

		it('should return null when all notes are excluded', () => {
			const note1 = new TFile('note1.md');
			const note2 = new TFile('note2.md');

			plugin.notes = [note1, note2];
			plugin.data.notes[note1.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 1000 };
			plugin.data.notes[note2.path] = { ...DEFAULT_NOTE_DATA, lastSeen: 500 };

			const excludePaths = new Set([note1.path, note2.path]);
			const oldest = plugin.getOldestNote(excludePaths);

			expect(oldest).toBeNull();
		});
	});

	describe('abortCurrentRequest', () => {
		it('should abort active request', () => {
			const mockAbortController = {
				abort: vi.fn(),
				signal: {} as AbortSignal,
			};
			plugin.currentAbortController = mockAbortController as any;

			plugin.abortCurrentRequest();

			expect(mockAbortController.abort).toHaveBeenCalled();
			expect(plugin.currentAbortController).toBeNull();
		});

		it('should do nothing when no active request', () => {
			plugin.currentAbortController = null;

			expect(() => plugin.abortCurrentRequest()).not.toThrow();
			expect(plugin.currentAbortController).toBeNull();
		});
	});
});

