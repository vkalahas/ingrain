import { App, Modal, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { StrictMode, useState, useEffect } from "react";
import type Ingrain from "../main";

interface ModalContentProps {
	plugin: Ingrain;
}

interface Message {
	role: string;
	content: string;
}

function ModalContent({ plugin }: ModalContentProps) {
	const [inputValue, setInputValue] = useState("");
	const [currentNote, setCurrentNote] = useState<TFile | null>(null);
	const [skippedPaths, setSkippedPaths] = useState<Set<string>>(new Set());
	const [aiResponse, setAiResponse] = useState("Loading quiz questions...");
	const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isMac = true;
	const cmdKey = isMac ? '⌘' : 'Ctrl';

	// Load initial note on mount
	useEffect(() => {
		const note = plugin.getOldestNote(skippedPaths);
		setCurrentNote(note);
	}, []);

	// Generate quiz when current note changes
	useEffect(() => {
		if (currentNote) {
			setAiResponse("Loading quiz questions...");
			setConversationHistory([]);
			void plugin.generateQuiz(currentNote).then((response) => {
				setAiResponse(response);
				// Initialize conversation history with the quiz
				const noteContent = plugin.app.vault.cachedRead(currentNote);
				void noteContent.then((content) => {
					setConversationHistory([
						{
							role: "user",
							content: `Quiz me on this note. Give me 5 questions.\n\n${content}`
						},
						{
							role: "assistant",
							content: response
						}
					]);
				});
			});
		}
	}, [currentNote]);

	const handleSkip = () => {
		if (currentNote) {
			const newSkipped = new Set(skippedPaths);
			newSkipped.add(currentNote.path);
			setSkippedPaths(newSkipped);

			const nextNote = plugin.getOldestNote(newSkipped);
			
			// Clear input and show loading state
			setInputValue("");
			setAiResponse("Loading quiz questions...");
			setConversationHistory([]);
			
			setCurrentNote(nextNote);
		}
	};

	const handleSubmit = async () => {
		if (!currentNote || !inputValue.trim() || isSubmitting) return;

		setIsSubmitting(true);
		setAiResponse("Thinking...");

		try {
			const response = await plugin.sendFollowUpMessage(
				currentNote,
				conversationHistory,
				inputValue
			);

			setAiResponse(response);
			
			// Update conversation history
			setConversationHistory([
				...conversationHistory,
				{ role: "user", content: inputValue },
				{ role: "assistant", content: response }
			]);

			// Clear input
			setInputValue("");
		} catch (error) {
			setAiResponse(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const noteTitle = currentNote ? currentNote.basename : "No notes found";

	return (
		<div className="ingrain-modal-content">
			<h2>Review</h2>
			<p className="ingrain-sample-text">
				You haven't looked at this note in a while: <strong>{noteTitle}</strong>
			</p>

			<textarea
				id="ingrain-ai-response"
				className="ingrain-textarea"
				placeholder="Waiting for AI response..."
				value={aiResponse}
				rows={6}
				readOnly={true}
			/>

			<textarea
				className="ingrain-textarea"
				placeholder="Type something here..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				rows={6}
			/>

		<div className="control-buttons">
			<button onClick={handleSkip}>Skip &nbsp; <kbd>{cmdKey} H</kbd></button>
			<button onClick={() => void handleSubmit()} disabled={isSubmitting || !inputValue.trim()}>
				{isSubmitting ? "Sending..." : "Submit"} &nbsp; 
				{isSubmitting ? (
					<span className="spinner">⏳</span>
				) : (
					<kbd>{cmdKey} Enter</kbd>
				)}
			</button>
		</div>

			{/* <div className="difficulty-buttons">
				<button className="difficulty-button easy-button">Easy &nbsp; <kbd>{cmdKey} 1</kbd></button>
				<button className="difficulty-button medium-button">Medium &nbsp; <kbd>{cmdKey} 2</kbd></button>
				<button className="difficulty-button hard-button">Hard &nbsp; <kbd>{cmdKey} 3</kbd></button>
				<div className="difficulty-tooltip">
					<span className="tooltip-icon">ⓘ</span>
					<span className="tooltip-text">Hide the difficulty buttons in Settings if all you want to do is review old notes</span>
				</div>
			</div> */}
		</div>
	);
}

export class ReactModal extends Modal {
	private root: Root | null = null;
	private plugin: Ingrain;

	constructor(app: App, plugin: Ingrain) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ingrain-react-modal");

		this.root = createRoot(contentEl);
		this.root.render(
			<StrictMode>
				<ModalContent plugin={this.plugin} />
			</StrictMode>
		);
	}

	onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		const { contentEl } = this;
		contentEl.empty();
	}
}

