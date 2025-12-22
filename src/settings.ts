import { App, PluginSettingTab, Setting } from "obsidian";
import Ingrain from "./main";

export interface IngrainSettings {
	apiKey: string;
}

export const DEFAULT_SETTINGS: IngrainSettings = {
	apiKey: ''
}

export class IngrainSettingTab extends PluginSettingTab {
	plugin: Ingrain;

	constructor(app: App, plugin: Ingrain) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('API key')
			.setDesc('Enter your API key to enable AI question generation')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
	}
}
