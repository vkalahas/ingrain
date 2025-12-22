import { Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, IngrainSettings, IngrainSettingTab } from "./settings";
import { ReactModal } from "./ui/ReactModal";
import { PluginData, DEFAULT_DATA, DEFAULT_NOTE_DATA } from "./NoteReviewData";
import OpenAI from 'openai';

export default class Ingrain extends Plugin {
	settings: IngrainSettings;
	data: PluginData;
	notes: TFile[] = []

	async onload() {
		await this.loadSettings();
		await this.loadReviewData();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('sprout', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new ReactModal(this.app, this).open();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IngrainSettingTab(this.app, this));

		// ingrain get notes
		this.notes = this.app.vault.getMarkdownFiles();

		// Keep in sync with changes
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.notes.push(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.notes = this.notes.filter((f) => f.path !== file.path);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				if (file instanceof TFile && file.extension === "md") {
					const existing = this.notes.find((f) => f.path === oldPath);
					if (existing) existing.path = file.path;
					
				// Update review data with new path
				if (this.data.notes[oldPath]) {
					this.data.notes[file.path] = this.data.notes[oldPath];
					delete this.data.notes[oldPath];
					void this.saveReviewData();
				}
				}
			})
		);

		// Track lastSeen when a note is opened
		this.registerEvent(
			this.app.workspace.on("file-open", (file) => {
				if (!file || !(file instanceof TFile) || file.extension !== "md") return;

			const path = file.path;
			const note = this.data.notes[path] ?? { ...DEFAULT_NOTE_DATA };
			note.lastSeen = Date.now();
			this.data.notes[path] = note;
			void this.saveReviewData();
			})
		);
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<IngrainSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async loadReviewData() {
		this.data = Object.assign({}, DEFAULT_DATA, await this.loadData() as Partial<PluginData>);
	}

	async saveReviewData() {
		await this.saveData(this.data);
	}

	// Helper method to update review data after a review
	updateReview(filePath: string, ease: number) {
		const note = this.data.notes[filePath] ?? { ...DEFAULT_NOTE_DATA };
		note.ease = ease;
		note.lastReviewed = Date.now();
		this.data.notes[filePath] = note;
		void this.saveReviewData();
	}

	// Get the oldest note based on lastSeen timestamp, excluding specified paths
	getOldestNote(excludePaths: Set<string> = new Set()): TFile | null {
		if (this.notes.length === 0) return null;

		let oldest: TFile | null = null;
		let oldestTime = Infinity;

		for (const note of this.notes) {
			// Skip if this note is in the exclude list
			if (excludePaths.has(note.path)) continue;

			const reviewData = this.data.notes[note.path];
			const lastSeen = reviewData?.lastSeen ?? 0;
			
			if (lastSeen < oldestTime) {
				oldestTime = lastSeen;
				oldest = note;
			}
		}

		return oldest;
	}

	// Generate quiz questions using OpenAI API
	async generateQuiz(note: TFile): Promise<string> {
		if (!this.settings.apiKey) {
			return "Error: OpenAI API key not configured. Please add your API key in settings.";
		}

		try {
			// Read the note content
			const content = await this.app.vault.read(note);

			// Initialize OpenAI client
			const openai = new OpenAI({
				apiKey: this.settings.apiKey,
				dangerouslyAllowBrowser: true
			});

			// Call OpenAI API using the client
			const completion = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: `Quiz me on this note. Give me 5 questions.\n\n${content}`
					}
				],
				temperature: 0.7
			});

			return completion.choices[0]?.message?.content || "No response generated.";
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			return `Error: ${errorMessage}`;
		}
	}

	// Send a follow-up message to the AI with conversation history
	async sendFollowUpMessage(note: TFile, conversationHistory: Array<{role: string, content: string}>, userInput: string): Promise<string> {
		if (!this.settings.apiKey) {
			return "Error: OpenAI API key not configured. Please add your API key in settings.";
		}

		try {
			// Initialize OpenAI client
			const openai = new OpenAI({
				apiKey: this.settings.apiKey,
				dangerouslyAllowBrowser: true
			});

			// Build the messages array with conversation history and new user input
			const messages = [
				...conversationHistory,
				{
					role: "user",
					content: userInput
				}
			];

			// Call OpenAI API using the client
			const completion = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
				temperature: 0.7
			});

			return completion.choices[0]?.message?.content || "No response generated.";
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
			return `Error: ${errorMessage}`;
		}
	}
}
