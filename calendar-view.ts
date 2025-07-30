import { ItemView, WorkspaceLeaf, moment, MarkdownView } from 'obsidian';
import { CopyDateSettings } from './settings';

export const CALENDAR_VIEW_TYPE = 'copydate-calendar-view';

export class CalendarView extends ItemView {
	settings: CopyDateSettings;
	currentDate: moment.Moment;
	
	constructor(leaf: WorkspaceLeaf, settings: CopyDateSettings) {
		super(leaf);
		this.settings = settings;
		this.currentDate = moment();
	}

	getViewType() {
		return CALENDAR_VIEW_TYPE;
	}

	getDisplayText() {
		return 'Calendar';
	}

	getIcon() {
		return 'calendar-days';
	}

	async onOpen() {
		this.renderCalendar();
	}

	async onClose() {
		// Clean up if needed
	}

	updateSettings(settings: CopyDateSettings) {
		this.settings = settings;
		this.renderCalendar(); // Re-render with new settings
	}

	private renderCalendar() {
		const container = this.contentEl;
		container.empty();
		container.addClass('copydate-view');

		// Title
		const titleEl = container.createEl('div', { text: 'Select Date', cls: 'copydate-title' });

		// Navigation header
		const navEl = container.createEl('div', { cls: 'copydate-nav' });
		
		const prevButton = navEl.createEl('button', { text: '‹', cls: 'copydate-nav-btn' });
		prevButton.addEventListener('click', () => {
			this.currentDate.subtract(1, 'month');
			this.renderCalendar();
		});

		const monthYearEl = navEl.createEl('span', { 
			text: this.currentDate.format('MMMM YYYY'), 
			cls: 'copydate-month-year' 
		});

		const nextButton = navEl.createEl('button', { text: '›', cls: 'copydate-nav-btn' });
		nextButton.addEventListener('click', () => {
			this.currentDate.add(1, 'month');
			this.renderCalendar();
		});

		// Calendar grid
		const calendarEl = container.createEl('div', { cls: 'copydate-calendar' });
		
		// Day headers
		const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const headerRow = calendarEl.createEl('div', { cls: 'copydate-day-headers' });
		dayHeaders.forEach(day => {
			headerRow.createEl('div', { text: day, cls: 'copydate-day-header' });
		});

		// Calendar days
		this.renderCalendarDays(calendarEl);

		// Today button
		const todayButton = container.createEl('button', { text: 'Today', cls: 'copydate-today-btn' });
		todayButton.addEventListener('click', () => {
			this.selectDate(moment());
		});

		// Format settings display
		this.renderFormatDisplay(container);
	}

	private renderCalendarDays(calendarEl: HTMLElement) {
		const startOfMonth = this.currentDate.clone().startOf('month');
		const endOfMonth = this.currentDate.clone().endOf('month');
		const startDate = startOfMonth.clone().startOf('week');
		const endDate = endOfMonth.clone().endOf('week');

		const current = startDate.clone();
		const today = moment();

		const daysContainer = calendarEl.createEl('div', { cls: 'copydate-days' });

		while (current.isSameOrBefore(endDate, 'day')) {
			const dayEl = daysContainer.createEl('div', { 
				text: current.format('D'), 
				cls: 'copydate-day' 
			});

			// Add classes for styling
			if (!current.isSame(this.currentDate, 'month')) {
				dayEl.addClass('copydate-day-other-month');
			}
			
			if (current.isSame(today, 'day')) {
				dayEl.addClass('copydate-day-today');
			}

			// Add click handler
			const dateToSelect = current.clone();
			dayEl.addEventListener('click', () => {
				this.selectDate(dateToSelect);
			});

			current.add(1, 'day');
		}
	}

	private renderFormatDisplay(container: HTMLElement) {
		const formatContainer = container.createEl('div', { cls: 'copydate-format-display' });
		
		const formatLabel = formatContainer.createEl('div', { 
			text: 'Format:', 
			cls: 'copydate-format-label' 
		});

		let displayFormat = this.settings.dateFormat;
		if (displayFormat === 'custom') {
			displayFormat = this.settings.customFormat;
		}

		const formatValue = formatContainer.createEl('div', { 
			text: displayFormat,
			cls: 'copydate-format-value' 
		});

		const boldStatus = formatContainer.createEl('div', { 
			text: this.settings.useBoldFormatting ? 'Bold: ON' : 'Bold: OFF',
			cls: 'copydate-bold-status' 
		});
	}

	private selectDate(selectedDate: moment.Moment) {
		let format = this.settings.dateFormat;
		if (format === 'custom') {
			format = this.settings.customFormat;
		}

		try {
			const formattedDate = selectedDate.format(format);
			const finalText = this.settings.useBoldFormatting ? `**${formattedDate}**` : formattedDate;
			
			this.insertDateAtCursor(finalText);
		} catch (error) {
			console.error('Error formatting date:', error);
			// Fallback to default format
			const fallbackDate = selectedDate.format('YYYY-MM-DD');
			const finalText = this.settings.useBoldFormatting ? `**${fallbackDate}**` : fallbackDate;
			this.insertDateAtCursor(finalText);
		}
	}

	private insertDateAtCursor(formattedDate: string) {
		const { workspace } = this.app;
		
		// Method 1: Try to get the currently active markdown view
		const activeView = workspace.getActiveViewOfType(MarkdownView);
		
		if (activeView && activeView.editor) {
			// We have an active markdown view with an editor
			const editor = activeView.editor;
			
			// Insert the formatted date at cursor position
			const cursor = editor.getCursor();
			editor.replaceRange(formattedDate, cursor);
			
			// Move cursor to end of inserted text
			const newCursor = {
				line: cursor.line,
				ch: cursor.ch + formattedDate.length
			};
			editor.setCursor(newCursor);
			
			// Focus back to editor
			editor.focus();
			
			console.log('Date inserted successfully:', formattedDate);
			return;
		}

		// Method 2: Use the active file to find the correct markdown view
		const activeFile = workspace.getActiveFile();
		if (activeFile) {
			// Find the markdown view that corresponds to the active file
			const markdownLeaves = workspace.getLeavesOfType('markdown');
			
			for (const leaf of markdownLeaves) {
				const view = leaf.view as MarkdownView;
				if (view && view.file === activeFile && view.editor) {
					const editor = view.editor;
					
					// Insert the formatted date at cursor position
					const cursor = editor.getCursor();
					editor.replaceRange(formattedDate, cursor);
					
					// Move cursor to end of inserted text
					const newCursor = {
						line: cursor.line,
						ch: cursor.ch + formattedDate.length
					};
					editor.setCursor(newCursor);
					
					// Focus back to the editor and make sure the leaf is active
					workspace.setActiveLeaf(leaf);
					editor.focus();
					
					console.log('Date inserted in active file view:', formattedDate);
					return;
				}
			}
		}

		// Method 3: Fallback - find the most recently active markdown view
		const markdownLeaves = workspace.getLeavesOfType('markdown');
		
		if (markdownLeaves.length > 0) {
			// Use the active leaf from the workspace if it's a markdown leaf
			const activeLeaf = workspace.activeLeaf;
			if (activeLeaf && activeLeaf.view instanceof MarkdownView) {
				const view = activeLeaf.view as MarkdownView;
				if (view.editor) {
					const editor = view.editor;
					
					// Insert the formatted date at cursor position
					const cursor = editor.getCursor();
					editor.replaceRange(formattedDate, cursor);
					
					// Move cursor to end of inserted text
					const newCursor = {
						line: cursor.line,
						ch: cursor.ch + formattedDate.length
					};
					editor.setCursor(newCursor);
					
					editor.focus();
					
					console.log('Date inserted in active leaf markdown view:', formattedDate);
					return;
				}
			}
			
			// Last resort: get the first markdown view, but try to be smart about it
			// Look for a view that seems to be in focus (has cursor position)
			let bestLeaf = markdownLeaves[0];
			
			for (const leaf of markdownLeaves) {
				const view = leaf.view as MarkdownView;
				if (view && view.editor) {
					// Check if this editor has focus or recent activity
					try {
						const editor = view.editor;
						const cursor = editor.getCursor();
						// If we can get cursor position, this editor is likely active
						if (cursor) {
							bestLeaf = leaf;
							break;
						}
					} catch (e) {
						// Continue to next leaf
					}
				}
			}
			
			const view = bestLeaf.view as MarkdownView;
			if (view && view.editor) {
				const editor = view.editor;
				
				// Insert the formatted date at cursor position
				const cursor = editor.getCursor();
				editor.replaceRange(formattedDate, cursor);
				
				// Move cursor to end of inserted text
				const newCursor = {
					line: cursor.line,
					ch: cursor.ch + formattedDate.length
				};
				editor.setCursor(newCursor);
				
				// Focus back to the editor and make sure the leaf is active
				workspace.setActiveLeaf(bestLeaf);
				editor.focus();
				
				console.log('Date inserted in best available markdown view:', formattedDate);
				return;
			}
		}

		// Last resort: show error message
		console.warn('No active markdown view found. Please open a note first.');
		
		// Show a notice to user
		const notice = document.createElement('div');
		notice.textContent = 'Please open a note first to insert the date';
		notice.className = 'copydate-notice';
		document.body.appendChild(notice);
		
		setTimeout(() => {
			if (notice.parentNode) {
				notice.parentNode.removeChild(notice);
			}
		}, 3000);
	}
} 