import { App, Modal } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { StrictMode, useState } from "react";

function ModalContent() {
	const [inputValue, setInputValue] = useState("");


	const isMac = true;
	const cmdKey = isMac ? '⌘' : 'Ctrl';

	return (
		<div className="ingrain-modal-content">
			<h2>Welcome to Ingrain</h2>
			<p className="ingrain-sample-text">
				This is some sample text. Enter your thoughts in the textarea below.
			</p>
	
			<div className="difficulty-buttons">
				<button className="difficulty-button easy-button">Easy &nbsp; <kbd>{cmdKey} 1</kbd></button>
				<button className="difficulty-button medium-button">Medium &nbsp; <kbd>{cmdKey} 2</kbd></button>
				<button className="difficulty-button hard-button">Hard &nbsp; <kbd>{cmdKey} 3</kbd></button>
			</div>

			<textarea
				className="ingrain-textarea"
				placeholder="Type something here..."
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				rows={6}
			/>

			<div className="control-buttons">
				<button>Skip &nbsp; <kbd>{cmdKey} H</kbd></button>
				<button>Submit &nbsp; <kbd>{cmdKey} Enter</kbd></button>
			</div>
		</div>
	);
}

export class ReactModal extends Modal {
	private root: Root | null = null;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("ingrain-react-modal");
		
		this.root = createRoot(contentEl);
		this.root.render(
			<StrictMode>
				<ModalContent />
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

