import { App, PluginSettingTab, Setting } from 'obsidian';
import type TPSProjectsPlugin from './main';

/**
 * Settings tab for TPS Projects plugin
 */
export class TPSProjectsSettingTab extends PluginSettingTab {
    plugin: TPSProjectsPlugin;

    constructor(app: App, plugin: TPSProjectsPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const createSection = (title: string, open = false) => {
            const details = containerEl.createEl('details', { cls: 'tps-projects-settings-group' });
            details.style.border = '1px solid var(--background-modifier-border)';
            details.style.borderRadius = '6px';
            details.style.padding = '10px';
            details.style.marginBottom = '10px';
            if (open) details.setAttr('open', '');
            const summary = details.createEl('summary', { text: title });
            summary.style.fontWeight = 'bold';
            summary.style.cursor = 'pointer';
            summary.style.marginBottom = '10px';
            return details.createDiv({ cls: 'tps-projects-settings-group-content' });
        };

        containerEl.createEl('h2', { text: 'TPS Projects' });
        containerEl.createEl('p', {
            text: 'Display attached notes in an inline menu bar. Types are dynamically discovered from folder structure.',
        });

        // --- General Settings ---
        const general = createSection('General Settings', true);

        new Setting(general)
            .setName('Enable console logging')
            .setDesc('Show debug logs in the developer console.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.enableLogging).onChange(async (value) => {
                    this.plugin.settings.enableLogging = value;
                    await this.plugin.saveSettings();
                }),
            );

        new Setting(general)
            .setName('Show in Reading View')
            .setDesc('Display the attachments menu in Reading mode.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showInReadingView).onChange(async (value) => {
                    this.plugin.settings.showInReadingView = value;
                    await this.plugin.saveSettings();
                    this.plugin.projectMenuManager.ensureMenus();
                }),
            );

        new Setting(general)
            .setName('Show in Live Preview')
            .setDesc('Display the attachments menu in Live Preview mode.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.showInLivePreview).onChange(async (value) => {
                    this.plugin.settings.showInLivePreview = value;
                    await this.plugin.saveSettings();
                    this.plugin.projectMenuManager.ensureMenus();
                }),
            );

        // --- Type Configuration ---
        const types = createSection('Type Configuration', true);

        new Setting(types)
            .setName('Root folders to scan')
            .setDesc('One folder path per line. These folders will be scanned for types.')
            .addTextArea((text) => {
                text
                    .setPlaceholder('01 Action Items\n02 Pages')
                    .setValue(this.plugin.settings.typeFolders.join('\n'))
                    .onChange(async (value) => {
                        this.plugin.settings.typeFolders = value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                        await this.plugin.saveSettings();
                        this.plugin.typeService.invalidateCache();
                    });
                text.inputEl.rows = 4;
                text.inputEl.cols = 30;
            });

        new Setting(types)
            .setName('Type detection depth')
            .setDesc('How to discover types from folders.')
            .addDropdown((drop) =>
                drop
                    .addOption('leaf', 'Leaf folders only (most specific)')
                    .addOption('all', 'All folders')
                    .setValue(this.plugin.settings.typeDepth)
                    .onChange(async (value: 'all' | 'leaf') => {
                        this.plugin.settings.typeDepth = value;
                        await this.plugin.saveSettings();
                        this.plugin.typeService.invalidateCache();
                    }),
            );

        new Setting(types)
            .setName('Excluded folders')
            .setDesc('One folder path per line. These folders will be excluded from type detection.')
            .addTextArea((text) => {
                text
                    .setPlaceholder('System\n.obsidian\n.trash')
                    .setValue(this.plugin.settings.excludedFolders.join('\n'))
                    .onChange(async (value) => {
                        this.plugin.settings.excludedFolders = value
                            .split('\n')
                            .map((s) => s.trim())
                            .filter(Boolean);
                        await this.plugin.saveSettings();
                        this.plugin.typeService.invalidateCache();
                    });
                text.inputEl.rows = 4;
                text.inputEl.cols = 30;
            });

        // Show discovered types
        const typesPreview = types.createDiv();
        typesPreview.style.marginTop = '10px';
        typesPreview.style.padding = '8px';
        typesPreview.style.background = 'var(--background-primary)';
        typesPreview.style.borderRadius = '4px';
        typesPreview.style.fontSize = '12px';

        const discoveredTypes = this.plugin.typeService.getAllTypes();
        typesPreview.createEl('strong', { text: `Discovered Types (${discoveredTypes.length}):` });
        if (discoveredTypes.length === 0) {
            typesPreview.createEl('p', { text: 'No types found. Check your root folders configuration.' });
        } else {
            const list = typesPreview.createEl('ul');
            list.style.margin = '4px 0';
            list.style.paddingLeft = '20px';
            for (const type of discoveredTypes.slice(0, 15)) {
                list.createEl('li', { text: `${type.name} (${type.path})` });
            }
            if (discoveredTypes.length > 15) {
                list.createEl('li', { text: `... and ${discoveredTypes.length - 15} more` });
            }
        }

        // --- Attachment Settings ---
        const attachments = createSection('Attachment Settings', false);

        new Setting(attachments)
            .setName('Frontmatter key for attachments')
            .setDesc('The frontmatter property used to link notes together.')
            .addText((text) =>
                text
                    .setPlaceholder('attachments')
                    .setValue(this.plugin.settings.attachmentKey)
                    .onChange(async (value) => {
                        this.plugin.settings.attachmentKey = value || 'attachments';
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(attachments)
            .setName('Badge properties')
            .setDesc('Comma-separated list of frontmatter properties to display as badges (e.g., status, priority).')
            .addText((text) =>
                text
                    .setPlaceholder('status, priority')
                    .setValue(this.plugin.settings.badgeProperties.join(', '))
                    .onChange(async (value) => {
                        this.plugin.settings.badgeProperties = value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                        await this.plugin.saveSettings();
                        this.plugin.projectMenuManager.ensureMenus();
                    }),
            );
    }
}
