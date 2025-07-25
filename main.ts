import { Plugin, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { CalendarView, CALENDAR_VIEW_TYPE } from './calendar-view';
import { CopyDateSettings, CopyDateSettingsTab, DEFAULT_SETTINGS } from './settings';

export default class CopyDatePlugin extends Plugin {
	settings: CopyDateSettings;

	async onload() {
		await this.loadSettings();

		// Register the calendar view
		this.registerView(
			CALENDAR_VIEW_TYPE,
			(leaf) => new CalendarView(leaf, this.settings)
		);

		// Add ribbon icon to activate view
		const ribbonIconEl = this.addRibbonIcon('calendar-days', 'Open Calendar', (evt: MouseEvent) => {
			this.activateView();
		});
		ribbonIconEl.addClass('copydate-ribbon-class');

		// Add settings tab
		this.addSettingTab(new CopyDateSettingsTab(this.app, this));
	}

	onunload() {
		// Clean up resources when plugin is disabled
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update all calendar views with new settings
		this.updateAllCalendarViews();
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view doesn't exist, create a new leaf in the right sidebar
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: CALENDAR_VIEW_TYPE, active: true });
			}
		}

		// Reveal the leaf in case it's in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	private updateAllCalendarViews() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(CALENDAR_VIEW_TYPE);
		
		leaves.forEach(leaf => {
			const view = leaf.view as CalendarView;
			if (view && view.updateSettings) {
				view.updateSettings(this.settings);
			}
		});
	}
} 