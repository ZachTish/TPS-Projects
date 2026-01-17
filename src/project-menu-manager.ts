import { MarkdownView, TFile, Menu, setIcon, debounce } from 'obsidian';
import type TPSProjectsPlugin from './main';
import { MenuInstances, AttachedNote, NoteType } from './types';
import { CreateNoteModal } from './create-note-modal';

/**
 * Manages the inline project menu injection for markdown views
 */
export class ProjectMenuManager {
    plugin: TPSProjectsPlugin;
    menus: Map<MarkdownView, MenuInstances> = new Map();

    constructor(plugin: TPSProjectsPlugin) {
        this.plugin = plugin;
    }

    /**
     * Ensure menus exist for all active markdown views
     */
    ensureMenus(): void {
        if (!this.plugin?.app?.workspace) return;

        const activeViews = new Set<MarkdownView>();

        this.plugin.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
            const view = leaf.view as MarkdownView;
            if (!view || !view.file) return;

            activeViews.add(view);
            this.ensureReadingMenu(view);
            this.ensureLiveMenu(view);
        });

        // Cleanup stale menus
        for (const view of Array.from(this.menus.keys())) {
            if (!activeViews.has(view)) {
                this.cleanup(view);
            }
        }
    }

    /**
     * Ensure reading mode menu exists
     */
    private ensureReadingMenu(view: MarkdownView): void {
        if (!this.plugin.settings.showInReadingView) {
            this.removeMenu(view, 'reading');
            return;
        }

        if (view.getMode() !== 'preview') {
            this.removeMenu(view, 'reading');
            return;
        }

        const container = view.contentEl?.querySelector('.markdown-preview-sizer');
        if (!container) {
            this.removeMenu(view, 'reading');
            return;
        }

        const instances = this.menus.get(view) || {};

        // Check if file path matches
        if (instances.reading && instances.filePath !== view.file?.path) {
            this.removeMenu(view, 'reading');
        } else if (instances.reading && container.contains(instances.reading)) {
            // Valid menu exists - refresh its content
            this.refreshMenuContent(instances.reading, view.file!);
            return;
        }

        this.removeMenu(view, 'reading');

        const menu = this.createProjectMenu(view, 'reading');
        if (menu) {
            // Insert after TPS-Global-Context-Menu if it exists, otherwise after inline title
            const globalContextMenu = container.querySelector('.tps-global-context-menu--reading');
            const inlineTitle = container.querySelector('.inline-title');

            if (globalContextMenu) {
                globalContextMenu.after(menu);
            } else if (inlineTitle) {
                inlineTitle.after(menu);
            } else {
                container.prepend(menu);
            }
            instances.reading = menu;
            instances.filePath = view.file!.path;
            this.menus.set(view, instances);
        }
    }

    /**
     * Ensure live preview menu exists
     */
    private ensureLiveMenu(view: MarkdownView): void {
        if (!this.plugin.settings.showInLivePreview) {
            this.removeMenu(view, 'live');
            return;
        }

        if (view.getMode() !== 'source') {
            this.removeMenu(view, 'live');
            return;
        }

        const sourceContainer = view.contentEl?.querySelector('.markdown-source-view');
        if (!sourceContainer || !sourceContainer.classList.contains('is-live-preview')) {
            this.removeMenu(view, 'live');
            return;
        }

        const instances = this.menus.get(view) || {};

        if (instances.live && instances.filePath !== view.file?.path) {
            this.removeMenu(view, 'live');
        } else if (instances.live && sourceContainer.contains(instances.live)) {
            this.refreshMenuContent(instances.live, view.file!);
            return;
        }

        this.removeMenu(view, 'live');

        const menu = this.createProjectMenu(view, 'live');
        if (menu) {
            sourceContainer.appendChild(menu);
            instances.live = menu;
            instances.filePath = view.file!.path;
            this.menus.set(view, instances);
        }
    }

    /**
     * Create the project menu element
     */
    private createProjectMenu(view: MarkdownView, mode: 'reading' | 'live'): HTMLElement | null {
        const file = view.file;
        if (!file) return null;

        const attachedNotes = this.plugin.relationshipService.getAttachedNotes(file);
        const parentNotes = this.plugin.relationshipService.getAllParentNotes(file);

        const menuEl = document.createElement('div');
        menuEl.className = `tps-projects-menu tps-projects-menu--${mode}`;
        menuEl.setAttribute('data-file-path', file.path);

        // Parent notes section (if any)
        if (parentNotes.length > 0) {
            const parentsSection = this.createParentsSection(parentNotes);
            menuEl.appendChild(parentsSection);
        }

        // Attachments Header
        const header = this.createHeader(file, attachedNotes.length, menuEl);
        menuEl.appendChild(header);

        // List container
        const list = document.createElement('div');
        list.className = 'tps-projects-list';

        if (attachedNotes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'tps-projects-empty';
            empty.textContent = 'No attached notes yet';
            list.appendChild(empty);
        } else {
            for (const note of attachedNotes) {
                list.appendChild(this.createNoteItem(note));
            }
        }

        menuEl.appendChild(list);
        return menuEl;
    }

    /**
     * Create the parent notes display section
     */
    private createParentsSection(parentNotes: TFile[]): HTMLElement {
        const section = document.createElement('div');
        section.className = 'tps-projects-parents';

        const label = document.createElement('span');
        label.className = 'tps-projects-parents-label';
        label.textContent = 'Parent:';
        section.appendChild(label);

        for (const parent of parentNotes) {
            const link = document.createElement('span');
            link.className = 'tps-projects-parent-link';

            // Get display title
            const cache = this.plugin.app.metadataCache.getFileCache(parent);
            let displayTitle = cache?.frontmatter?.title || parent.basename;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(displayTitle)) {
                displayTitle = displayTitle.replace(/ \d{4}-\d{2}-\d{2}$/, '');
            }

            link.textContent = displayTitle;
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                this.plugin.app.workspace.getLeaf('tab').openFile(parent);
            });
            section.appendChild(link);
        }

        return section;
    }

    /**
     * Create the menu header with collapse/expand and add button
     */
    private createHeader(file: TFile, count: number, menuEl: HTMLElement): HTMLElement {
        const header = document.createElement('div');
        header.className = 'tps-projects-header';

        // Left side
        const left = document.createElement('div');
        left.className = 'tps-projects-header-left';

        // Collapse button
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'tps-projects-collapse-btn';
        collapseBtn.setAttribute('aria-label', 'Toggle attachments');
        setIcon(collapseBtn, 'chevron-down');

        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuEl.classList.toggle('tps-projects-menu--collapsed');
        });
        left.appendChild(collapseBtn);

        // Title
        const title = document.createElement('span');
        title.className = 'tps-projects-header-title';
        title.textContent = 'Attachments';
        left.appendChild(title);

        // Count badge
        const countBadge = document.createElement('span');
        countBadge.className = 'tps-projects-header-count';
        countBadge.textContent = String(count);
        left.appendChild(countBadge);

        header.appendChild(left);

        // Right side - actions
        const actions = document.createElement('div');
        actions.className = 'tps-projects-header-actions';

        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'tps-projects-add-btn';
        addBtn.innerHTML = '<span>+ Add</span>';

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showAddMenu(e, file);
        });
        actions.appendChild(addBtn);

        header.appendChild(actions);

        // Make header clickable to toggle
        header.addEventListener('click', () => {
            menuEl.classList.toggle('tps-projects-menu--collapsed');
        });

        return header;
    }

    /**
     * Create a note item row
     */
    private createNoteItem(note: AttachedNote): HTMLElement {
        const item = document.createElement('div');
        item.className = 'tps-projects-item';
        item.setAttribute('data-path', note.file.path);

        // Left side
        const left = document.createElement('div');
        left.className = 'tps-projects-item-left';

        // Icon
        const icon = document.createElement('span');
        icon.className = 'tps-projects-item-icon';
        const iconName = note.type
            ? this.plugin.typeService.getTypeIcon(note.type)
            : 'file-text';
        setIcon(icon, iconName);
        left.appendChild(icon);

        // Title - ONLY the title opens the note
        const title = document.createElement('span');
        title.className = 'tps-projects-item-title tps-projects-item-title--clickable';

        // Use title from frontmatter or file basename, hide date suffix
        let displayTitle = note.frontmatter.title || note.file.basename;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(displayTitle)) {
            displayTitle = displayTitle.replace(/ \d{4}-\d{2}-\d{2}$/, '');
        }
        title.textContent = displayTitle;
        title.addEventListener('click', (e) => {
            e.stopPropagation();
            this.plugin.app.workspace.getLeaf('tab').openFile(note.file);
        });
        left.appendChild(title);

        // Type badge
        if (note.type) {
            const typeBadge = document.createElement('span');
            typeBadge.className = 'tps-projects-item-type';
            typeBadge.textContent = note.type.name;
            left.appendChild(typeBadge);
        }

        item.appendChild(left);

        // Right side - clickable badges for editing properties
        const badges = document.createElement('div');
        badges.className = 'tps-projects-item-badges';

        const badgeProps = this.plugin.settings.badgeProperties || [];
        for (const prop of badgeProps) {
            const value = note.frontmatter[prop];
            if (value) {
                const badge = document.createElement('span');
                badge.className = `tps-projects-badge tps-projects-badge-${prop} tps-projects-badge-${value} tps-projects-badge--clickable`;
                badge.textContent = value;

                // Make badge clickable to edit property
                badge.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showPropertyMenu(e, note.file, prop, value);
                });

                badges.appendChild(badge);
            }
        }

        item.appendChild(badges);

        return item;
    }

    /**
     * Show a menu to change a property value
     */
    private showPropertyMenu(event: MouseEvent, file: TFile, propKey: string, currentValue: string): void {
        const menu = new Menu();

        // Get options based on property type
        const options = this.getPropertyOptions(propKey);

        for (const opt of options) {
            menu.addItem((item) => {
                item.setTitle(opt)
                    .setChecked(currentValue === opt)
                    .onClick(async () => {
                        // Update the frontmatter
                        await this.plugin.app.fileManager.processFrontMatter(file, (fm) => {
                            fm[propKey] = opt;
                        });
                        // Refresh menus
                        this.ensureMenus();
                    });
            });
        }

        menu.showAtMouseEvent(event);
    }

    /**
     * Get available options for a property
     */
    private getPropertyOptions(propKey: string): string[] {
        // Default options for common properties
        const optionsMap: Record<string, string[]> = {
            status: ['open', 'working', 'blocked', 'wont-do', 'complete'],
            priority: ['high', 'medium', 'normal', 'low'],
        };
        return optionsMap[propKey] || [];
    }

    /**
     * Show the "Add" menu with available types
     */
    private showAddMenu(event: MouseEvent, parentFile: TFile): void {
        const menu = new Menu();
        const types = this.plugin.typeService.getAllTypes();

        if (types.length === 0) {
            menu.addItem((item) => {
                item.setTitle('No types available')
                    .setDisabled(true);
            });
        } else {
            for (const type of types) {
                menu.addItem((item) => {
                    const iconName = this.plugin.typeService.getTypeIcon(type);
                    item.setTitle(type.name)
                        .setIcon(iconName)
                        .onClick(() => {
                            this.promptCreateNote(parentFile, type);
                        });
                });
            }
        }

        menu.showAtMouseEvent(event);
    }

    /**
     * Prompt user for note details and create attached note
     */
    private promptCreateNote(parentFile: TFile, type: NoteType): void {
        new CreateNoteModal(
            this.plugin.app,
            type,
            parentFile,
            async (result) => {
                if (!result) return;

                try {
                    const newFile = await this.plugin.relationshipService.createAttachedNote(
                        parentFile,
                        type,
                        result.title,
                        {
                            body: result.body,
                            status: result.status,
                            priority: result.priority,
                        }
                    );

                    // Open the new note
                    this.plugin.app.workspace.getLeaf('tab').openFile(newFile);

                    // Refresh menus
                    this.ensureMenus();
                } catch (e: any) {
                    console.error('[TPS Projects] Failed to create note:', e);
                }
            }
        ).open();
    }

    /**
     * Refresh the content of an existing menu
     */
    private refreshMenuContent(menuEl: HTMLElement, file: TFile): void {
        const attachedNotes = this.plugin.relationshipService.getAttachedNotes(file);

        // Update count
        const countEl = menuEl.querySelector('.tps-projects-header-count');
        if (countEl) {
            countEl.textContent = String(attachedNotes.length);
        }

        // Update list
        const listEl = menuEl.querySelector('.tps-projects-list');
        if (listEl) {
            listEl.innerHTML = '';

            if (attachedNotes.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'tps-projects-empty';
                empty.textContent = 'No attached notes yet';
                listEl.appendChild(empty);
            } else {
                for (const note of attachedNotes) {
                    listEl.appendChild(this.createNoteItem(note));
                }
            }
        }
    }

    /**
     * Remove a specific menu type
     */
    private removeMenu(view: MarkdownView, type: 'reading' | 'live'): void {
        const instances = this.menus.get(view);
        if (!instances) return;

        if (type === 'reading' && instances.reading) {
            instances.reading.remove();
            instances.reading = null;
        } else if (type === 'live' && instances.live) {
            instances.live.remove();
            instances.live = null;
        }

        if (!instances.reading && !instances.live) {
            this.menus.delete(view);
        } else {
            this.menus.set(view, instances);
        }
    }

    /**
     * Cleanup all menus for a view
     */
    cleanup(view: MarkdownView): void {
        const instances = this.menus.get(view);
        if (!instances) return;

        instances.reading?.remove();
        instances.live?.remove();
        this.menus.delete(view);
    }

    /**
     * Refresh menus for a specific file
     */
    refreshMenusForFile(file: TFile): void {
        for (const [view, instances] of this.menus.entries()) {
            if (view.file?.path === file.path) {
                if (instances.reading) {
                    this.refreshMenuContent(instances.reading, file);
                }
                if (instances.live) {
                    this.refreshMenuContent(instances.live, file);
                }
            }
        }
    }

    /**
     * Detach all menus
     */
    detach(): void {
        for (const view of Array.from(this.menus.keys())) {
            this.cleanup(view);
        }
    }
}
