import { App, Component, MarkdownRenderer, Modal, TFile } from "obsidian";
import type Ingrain from "../main";

interface Message {
	role: string;
	content: string;
}

export class ReviewModal extends Modal {
	private plugin: Ingrain;

	// State - persists across open/close since we reuse the same instance
	private currentNote: TFile | null = null;
	private aiResponse = "";
	private conversationHistory: Message[] = [];
	private skippedPaths = new Set<string>();
	private inputValue = "";
	private isLoading = false;
	private isSubmitting = false;
	private hasSubmittedAnswer = false;
	private hasInitializedSession = false;

	// UI elements
	private responseContainerEl: HTMLDivElement | null = null;
	private textareaEl: HTMLTextAreaElement | null = null;
	private noteLinkEl: HTMLElement | null = null;
	private skipButtonEl: HTMLButtonElement | null = null;
	private submitButtonEl: HTMLButtonElement | null = null;
	private nextButtonEl: HTMLButtonElement | null = null;

	// Markdown rendering
	private markdownComponent: Component | null = null;

	// Keyboard handler reference for cleanup
	private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

	constructor(app: App, plugin: Ingrain) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ingrain-modal");

		this.buildUI();
		this.registerKeyboardShortcuts();

		// Initialize session on first open
		if (!this.hasInitializedSession) {
			this.initializeSession();
		} else {
			// Reopening - just refresh the display
			this.updateResponseDisplay();
			this.updateButtonStates();
		}

		// Focus the textarea (delayed to override Obsidian's default focus behavior)
		setTimeout(() => this.textareaEl?.focus(), 0);
	}

	onClose() {
		this.unregisterKeyboardShortcuts();
		this.cleanupMarkdown();
	}

	private buildUI() {
		const { contentEl } = this;

		// Create modal content wrapper
		const wrapper = contentEl.createDiv({ cls: "ingrain-modal-content" });

		// Header
		wrapper.createEl("h2", { text: "Review" });

		// Note info paragraph
		const infoParagraph = wrapper.createEl("p", { cls: "ingrain-sample-text" });
		infoParagraph.appendText("You haven't looked at this note in a while: ");

		this.noteLinkEl = infoParagraph.createEl("strong", {
			cls: "ingrain-note-link",
			text: this.currentNote?.basename ?? "No notes found",
			attr: {
				role: "button",
				tabindex: "0",
			},
		});
		this.noteLinkEl.addEventListener("click", () => this.handleOpenNote());
		this.noteLinkEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				this.handleOpenNote();
			}
		});

		// AI Response container
		this.responseContainerEl = wrapper.createDiv({
			cls: "ingrain-response-container markdown-rendered",
			attr: { id: "ingrain-ai-response" },
		});

		// Textarea
		this.textareaEl = wrapper.createEl("textarea", {
			cls: "ingrain-textarea",
			attr: {
				placeholder: "Type something here...",
				rows: "6",
			},
		});
		this.textareaEl.value = this.inputValue;
		this.textareaEl.addEventListener("input", (e) => {
			this.inputValue = (e.target as HTMLTextAreaElement).value;
			this.updateButtonStates();
		});
		this.textareaEl.addEventListener("keydown", (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				void this.handleSubmit();
			}
		});

		// Control buttons
		const cmdKey = "⌘"; // Could detect platform, but keeping simple
		const buttonContainer = wrapper.createDiv({ cls: "control-buttons" });

		// Skip button
		this.skipButtonEl = buttonContainer.createEl("button");
		this.skipButtonEl.appendText("Skip\u00A0\u00A0");
		this.skipButtonEl.createEl("kbd", { text: `${cmdKey} 4` });
		this.skipButtonEl.addEventListener("click", () => this.handleSkip());

		// Submit button
		this.submitButtonEl = buttonContainer.createEl("button");
		this.updateSubmitButtonContent();
		this.submitButtonEl.addEventListener("click", () => void this.handleSubmit());

		// Next button
		this.nextButtonEl = buttonContainer.createEl("button", { cls: "next-button" });
		this.nextButtonEl.appendText("Next\u00A0\u00A0");
		this.nextButtonEl.createEl("kbd", { text: `${cmdKey} 5` });
		this.nextButtonEl.addEventListener("click", () => this.handleNext());

		this.updateButtonStates();
		this.updateResponseDisplay();
	}

	private initializeSession() {
		this.hasInitializedSession = true;
		
		// Auto-select oldest note and generate quiz
		const note = this.plugin.getOldestNote(this.skippedPaths) || this.plugin.getOldestNote();
		this.currentNote = note;
		this.updateNoteLink();

		if (note) {
			this.generateQuizForNote(note);
		} else {
			this.isLoading = false;
			this.updateResponseDisplay();
		}
	}

	private generateQuizForNote(note: TFile) {
		this.isLoading = true;
		this.aiResponse = "";
		this.conversationHistory = [];
		this.updateResponseDisplay();
		this.updateButtonStates();

		void this.plugin.generateQuiz(note).then((response) => {
			// Empty response means the request was aborted
			if (response === "") {
				return;
			}

			void this.plugin.app.vault.cachedRead(note).then((content) => {
				this.conversationHistory = [
					{
						role: "user",
						content: `Quiz me on this note. Give me 5 questions. Randomize the questions. Focus on different parts of the note every time. \n\n${content}`,
					},
					{
						role: "assistant",
						content: response,
					},
				];

				this.aiResponse = response;
				this.isLoading = false;
				this.updateResponseDisplay();
				this.updateButtonStates();
			});
		});
	}

	private handleSkip() {
		if (!this.currentNote || this.isLoading || this.isSubmitting || this.hasSubmittedAnswer) {
			return;
		}

		this.skippedPaths.add(this.currentNote.path);

		// Get next note, fallback to oldest note without exclusions
		let nextNote = this.plugin.getOldestNote(this.skippedPaths);
		if (!nextNote) {
			// All notes skipped, reset and get the oldest note
			this.skippedPaths.clear();
			nextNote = this.plugin.getOldestNote();
		}

		// Clear input and reset state
		this.inputValue = "";
		this.hasSubmittedAnswer = false;
		if (this.textareaEl) {
			this.textareaEl.value = "";
		}

		this.currentNote = nextNote;
		this.updateNoteLink();

		if (nextNote) {
			this.generateQuizForNote(nextNote);
		}
	}

	private async handleSubmit() {
		if (!this.currentNote || !this.inputValue.trim() || this.isSubmitting) {
			return;
		}

		this.isSubmitting = true;
		this.updateResponseDisplay();
		this.updateButtonStates();

		try {
			const response = await this.plugin.sendFollowUpMessage(
				this.currentNote,
				this.conversationHistory,
				this.inputValue
			);

			// Update conversation history
			this.conversationHistory = [
				...this.conversationHistory,
				{ role: "user", content: this.inputValue },
				{ role: "assistant", content: response },
			];

			// Update lastReviewed and lastSeen timestamps
			this.plugin.markAsReviewed(this.currentNote.path);

			// Mark that user has submitted an answer
			this.hasSubmittedAnswer = true;

			// Clear input
			this.inputValue = "";
			if (this.textareaEl) {
				this.textareaEl.value = "";
			}

			// Update response
			this.aiResponse = response;
			this.isSubmitting = false;
			this.updateResponseDisplay();
			this.updateButtonStates();
		} catch (error) {
			this.isSubmitting = false;
			this.aiResponse = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
			this.updateResponseDisplay();
			this.updateButtonStates();
		}
	}

	private handleNext() {
		if (!this.currentNote || !this.hasSubmittedAnswer) {
			return;
		}

		// Get next note, excluding the current note
		const excludePaths = new Set(this.skippedPaths);
		excludePaths.add(this.currentNote.path);
		let nextNote = this.plugin.getOldestNote(excludePaths);

		// If no other notes available, just get the oldest one
		if (!nextNote) {
			nextNote = this.plugin.getOldestNote();
		}

		// Clear input and reset state
		this.inputValue = "";
		this.hasSubmittedAnswer = false;
		if (this.textareaEl) {
			this.textareaEl.value = "";
		}

		this.currentNote = nextNote;
		this.updateNoteLink();

		if (nextNote) {
			this.generateQuizForNote(nextNote);
		}
	}

	private handleOpenNote() {
		if (this.currentNote) {
			const leaf = this.app.workspace.getLeaf(false);
			void leaf.openFile(this.currentNote);
			this.close();
		}
	}

	private updateNoteLink() {
		if (this.noteLinkEl) {
			this.noteLinkEl.textContent = this.currentNote?.basename ?? "No notes found";
		}
	}

	private updateResponseDisplay() {
		if (!this.responseContainerEl) return;

		this.cleanupMarkdown();
		this.responseContainerEl.empty();

		// Show spinner for loading states
		if (this.isLoading || this.isSubmitting) {
			const loadingContainer = this.responseContainerEl.createDiv({ cls: "ingrain-loading" });
			loadingContainer.createSpan({ cls: "spinner" });
			loadingContainer.createSpan({ text: this.isLoading ? "Loading" : "Thinking" });
			return;
		}

		// Render markdown for actual content
		const displayContent = this.aiResponse || "Waiting for AI response...";

		this.markdownComponent = new Component();
		this.markdownComponent.load();

		const sourcePath = this.currentNote?.path ?? "";
		void MarkdownRenderer.render(
			this.app,
			displayContent,
			this.responseContainerEl,
			sourcePath,
			this.markdownComponent
		);
	}

	private updateButtonStates() {
		if (this.skipButtonEl) {
			this.skipButtonEl.disabled = this.isLoading || this.isSubmitting || this.hasSubmittedAnswer;
		}

		if (this.submitButtonEl) {
			this.submitButtonEl.disabled = this.isSubmitting || !this.inputValue.trim();
			this.updateSubmitButtonContent();
		}

		if (this.nextButtonEl) {
			this.nextButtonEl.disabled = !this.hasSubmittedAnswer || this.isSubmitting;
		}
	}

	private updateSubmitButtonContent() {
		if (!this.submitButtonEl) return;
		const cmdKey = "⌘";

		this.submitButtonEl.empty();
		if (this.isSubmitting) {
			this.submitButtonEl.appendText("Sending\u00A0");
			this.submitButtonEl.createSpan({ cls: "spinner" });
		} else {
			this.submitButtonEl.appendText("Submit\u00A0\u00A0");
			this.submitButtonEl.createEl("kbd", { text: `${cmdKey} Enter` });
		}
	}

	private registerKeyboardShortcuts() {
		this.keydownHandler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "4") {
				e.preventDefault();
				this.handleSkip();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === "5") {
				e.preventDefault();
				this.handleNext();
			}
		};
		window.addEventListener("keydown", this.keydownHandler);
	}

	private unregisterKeyboardShortcuts() {
		if (this.keydownHandler) {
			window.removeEventListener("keydown", this.keydownHandler);
			this.keydownHandler = null;
		}
	}

	private cleanupMarkdown() {
		if (this.markdownComponent) {
			this.markdownComponent.unload();
			this.markdownComponent = null;
		}
	}
}

