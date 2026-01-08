import { App, PluginSettingTab, Setting } from "obsidian";
import Boomerang from "./main";

export interface BoomerangSettings {
	apiKey: string;
}

export const DEFAULT_SETTINGS: BoomerangSettings = {
	apiKey: ''
}

export class BoomerangSettingTab extends PluginSettingTab {
	plugin: Boomerang;
	name = 'Boomerang';

	constructor(app: App, plugin: Boomerang) {
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
