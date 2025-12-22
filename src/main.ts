import { App, Editor, MarkdownView, Modal, Notice, Plugin } from 'obsidian';
import {DEFAULT_SETTINGS, IngrainSettings, IngrainSettingTab} from "./settings";
import {ReactModal} from "./ui/ReactModal";

// Remember to rename these classes and interfaces!

export default class Ingrain extends Plugin {
	settings: IngrainSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('sprout', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new ReactModal(this.app).open();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new IngrainSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<IngrainSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
