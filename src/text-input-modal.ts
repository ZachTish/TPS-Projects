import { App, Modal, TextComponent } from 'obsidian';

/**
 * Modal for text input (replaces unsupported prompt())
 */
export class TextInputModal extends Modal {
    private result: string = '';
    private onSubmit: (result: string | null) => void;
    private placeholder: string;
    private title: string;

    constructor(
        app: App,
        title: string,
        placeholder: string,
        onSubmit: (result: string | null) => void
    ) {
        super(app);
        this.title = title;
        this.placeholder = placeholder;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('tps-projects-input-modal');

        // Title
        contentEl.createEl('h3', { text: this.title });

        // Input
        const inputContainer = contentEl.createDiv({ cls: 'tps-projects-input-container' });
        const textComponent = new TextComponent(inputContainer);
        textComponent.setPlaceholder(this.placeholder);
        textComponent.inputEl.style.width = '100%';
        textComponent.inputEl.focus();

        textComponent.onChange((value) => {
            this.result = value;
        });

        // Handle Enter key
        textComponent.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submit();
            } else if (e.key === 'Escape') {
                this.cancel();
            }
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
        if (this.result.trim()) {
            this.onSubmit(this.result.trim());
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
