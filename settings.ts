import { App, PluginSettingTab, Setting } from 'obsidian';
import CopyDatePlugin from './main';

export interface CopyDateSettings {
	dateFormat: string;
	useBoldFormatting: boolean;
	customFormat: string;
}

export const DEFAULT_SETTINGS: CopyDateSettings = {
	dateFormat: 'YYYY-MM-DD',
	useBoldFormatting: true,
	customFormat: 'YYYY-MM-DD'
};

export const DATE_FORMAT_OPTIONS = [
	{ value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2025-01-25)' },
	{ value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (e.g., 25-01-2025)' },
	{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 25/01/2025)' },
	{ value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 01/25/2025)' },
	{ value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY (e.g., January 25, 2025)' },
	{ value: 'DD MMMM YYYY', label: 'DD MMMM YYYY (e.g., 25 January 2025)' },
	{ value: 'custom', label: 'Custom format' }
];

export class CopyDateSettingsTab extends PluginSettingTab {
	plugin: CopyDatePlugin;

	constructor(app: App, plugin: CopyDatePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('CopyDate Calendar Settings')
			.setHeading();

		// Date format setting
		new Setting(containerEl)
			.setName('Date format')
			.setDesc('Choose how dates should be formatted when inserted')
			.addDropdown(dropdown => {
				DATE_FORMAT_OPTIONS.forEach(option => {
					dropdown.addOption(option.value, option.label);
				});
				dropdown.setValue(this.plugin.settings.dateFormat);
				dropdown.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide custom format input
				});
			});

		// Custom format input (only show when custom is selected)
		if (this.plugin.settings.dateFormat === 'custom') {
			new Setting(containerEl)
				.setName('Custom date format')
				.setDesc('Use moment.js format tokens (e.g., YYYY-MM-DD, DD/MM/YY, etc.)')
				.addText(text => text
					.setPlaceholder('YYYY-MM-DD')
					.setValue(this.plugin.settings.customFormat)
					.onChange(async (value) => {
						this.plugin.settings.customFormat = value;
						await this.plugin.saveSettings();
					}));
		}

		// Bold formatting toggle
		new Setting(containerEl)
			.setName('Bold formatting')
			.setDesc('Wrap inserted dates with ** to make them bold')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useBoldFormatting)
				.onChange(async (value) => {
					this.plugin.settings.useBoldFormatting = value;
					await this.plugin.saveSettings();
					// Update preview when bold setting changes
					const previewContainer = containerEl.querySelector('.copydate-preview') as HTMLElement;
					if (previewContainer) {
						this.updatePreview(previewContainer);
					}
				}));

		// Preview section
		new Setting(containerEl)
			.setName('Preview')
			.setHeading();

		const previewContainer = containerEl.createDiv('copydate-preview');
		this.updatePreview(previewContainer);
	}

	private updatePreview(container: HTMLElement) {
		container.empty();
		const today = new Date();
		const moment = (window as any).moment || require('moment');
		
		let format = this.plugin.settings.dateFormat;
		if (format === 'custom') {
			format = this.plugin.settings.customFormat;
		}

		try {
			const formattedDate = moment(today).format(format);
			const finalText = this.plugin.settings.useBoldFormatting ? `**${formattedDate}**` : formattedDate;
			
			const previewEl = container.createEl('div', { cls: 'copydate-preview-text' });
			previewEl.textContent = `Preview: ${finalText}`;
		} catch (error) {
			const previewEl = container.createEl('div', { cls: 'copydate-preview-error' });
			previewEl.textContent = 'Invalid format';
		}
	}
} 