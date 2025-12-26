// Mock Obsidian API for testing
export class Plugin {
	app: any;
	manifest: any;
	
	loadData(): Promise<any> {
		return Promise.resolve({});
	}
	
	saveData(data: any): Promise<void> {
		return Promise.resolve();
	}
	
	addCommand(command: any): void {}
	addRibbonIcon(icon: string, title: string, callback: Function): any {}
	addStatusBarItem(): any {
		return { setText: () => {} };
	}
	addSettingTab(tab: any): void {}
	registerEvent(event: any): void {}
	registerDomEvent(el: any, type: string, callback: Function): void {}
	registerInterval(interval: number): void {}
	
	onload(): void {}
	onunload(): void {}
}

export class TFile {
	path: string;
	name: string;
	basename: string;
	extension: string;
	
	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() || '';
		this.basename = this.name.replace(/\.[^.]+$/, '');
		this.extension = this.name.split('.').pop() || '';
	}
}

export class App {
	vault: any;
	workspace: any;
}

export class PluginSettingTab {
	app: App;
	plugin: Plugin;
	containerEl: any;
	
	constructor(app: App, plugin: Plugin) {
		this.app = app;
		this.plugin = plugin;
		this.containerEl = {};
	}
	
	display(): void {}
	hide(): void {}
}

export class Setting {
	constructor(containerEl: any) {}
	setName(name: string): this { return this; }
	setDesc(desc: string): this { return this; }
	addText(callback: Function): this { return this; }
	addToggle(callback: Function): this { return this; }
}

export class Modal {
	app: App;
	containerEl: any;
	modalEl: any;
	titleEl: any;
	contentEl: any;
	
	constructor(app: App) {
		this.app = app;
		this.containerEl = {};
		this.modalEl = {};
		this.titleEl = {};
		this.contentEl = {};
	}
	
	open(): void {}
	close(): void {}
	onOpen(): void {}
	onClose(): void {}
}

