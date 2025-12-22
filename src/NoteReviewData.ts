export interface NoteReviewData {
    ease: number;          // e.g. 130–250
    lastReviewed: number;  // timestamp (Date.now())
    lastSeen: number;      // timestamp
}

export interface PluginData {
    notes: Record<string, NoteReviewData>; // key = file.path
}

export const DEFAULT_DATA: PluginData = { notes: {} };

export const DEFAULT_NOTE_DATA: NoteReviewData = {
    ease: 200,
    lastReviewed: 0,
    lastSeen: 0,
};
