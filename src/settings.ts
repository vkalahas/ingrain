import { App, PluginSettingTab, Setting } from "obsidian";
import Ingrain from "./main";

export interface IngrainSettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: IngrainSettings = {
	mySetting: 'default'
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
			.setName('AI API key')
			.setDesc('Enables AI question generation.')
			.addText(text => text
				.setPlaceholder('Enter your API key here.')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
