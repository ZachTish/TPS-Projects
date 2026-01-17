import { App, Modal, TextComponent, TextAreaComponent, Setting, TFile } from 'obsidian';
import { NoteType } from './types';

/**
 * Enhanced modal for creating new attached notes.
 * Allows setting title, body, and properties before creation.
 */
export class CreateNoteModal extends Modal {
    private title: string = '';
    private body: string = '';
    private status: string = 'open';
    private priority: string = 'normal';
    private onSubmit: (result: { title: string; body: string; status: string; priority: string } | null) => void;
    private noteType: NoteType;
    private parentFile: TFile;

    // Property options (could be made configurable)
    private statusOptions = ['open', 'working', 'blocked', 'wont-do', 'complete'];
    private priorityOptions = ['high', 'medium', 'normal', 'low'];

    constructor(
        app: App,
        noteType: NoteType,
        parentFile: TFile,
        onSubmit: (result: { title: string; body: string; status: string; priority: string } | null) => void
    ) {
        super(app);
        this.noteType = noteType;
        this.parentFile = parentFile;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('tps-projects-create-modal');

        // Header
        contentEl.createEl('h3', { text: `Create new ${this.noteType.name} note` });
        contentEl.createEl('p', {
            text: `Attached to: ${this.parentFile.basename}`,
            cls: 'tps-projects-create-modal-subtitle'
        });

        // Title input
        new Setting(contentEl)
            .setName('Title')
            .setDesc('Name of the new note')
            .addText((text) => {
                text.setPlaceholder('Enter note title...');
                text.inputEl.style.width = '100%';
                text.onChange((value) => {
                    this.title = value;
                });
                // Focus on title
                setTimeout(() => text.inputEl.focus(), 50);
                // Handle Enter key
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.submit();
                    }
                });
            });

        // Body input (optional)
        new Setting(contentEl)
            .setName('Body (optional)')
            .setDesc('Initial content for the note');

        const bodyContainer = contentEl.createDiv({ cls: 'tps-projects-body-container' });
        const bodyTextArea = new TextAreaComponent(bodyContainer);
        bodyTextArea.setPlaceholder('Enter initial content...');
        bodyTextArea.inputEl.style.width = '100%';
        bodyTextArea.inputEl.style.minHeight = '100px';
        bodyTextArea.inputEl.style.resize = 'vertical';
        bodyTextArea.onChange((value) => {
            this.body = value;
        });

        // Status selector
        new Setting(contentEl)
            .setName('Status')
            .addDropdown((dropdown) => {
                this.statusOptions.forEach((opt) => {
                    dropdown.addOption(opt, opt.charAt(0).toUpperCase() + opt.slice(1));
                });
                dropdown.setValue(this.status);
                dropdown.onChange((value) => {
                    this.status = value;
                });
            });

        // Priority selector
        new Setting(contentEl)
            .setName('Priority')
            .addDropdown((dropdown) => {
                this.priorityOptions.forEach((opt) => {
                    dropdown.addOption(opt, opt.charAt(0).toUpperCase() + opt.slice(1));
                });
                dropdown.setValue(this.priority);
                dropdown.onChange((value) => {
                    this.priority = value;
                });
            });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'tps-projects-button-container' });
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '16px';

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.cancel());

        const submitBtn = buttonContainer.createEl('button', { text: 'Create', cls: 'mod-cta' });
        submitBtn.addEventListener('click', () => this.submit());
    }

    private submit() {
        if (this.title.trim()) {
            this.onSubmit({
                title: this.title.trim(),
                body: this.body,
                status: this.status,
                priority: this.priority,
            });
            this.close();
        }
    }

    private cancel() {
        this.onSubmit(null);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
