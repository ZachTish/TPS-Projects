import { Plugin, debounce } from 'obsidian';
import { TPSProjectsSettings } from './types';
import { DEFAULT_SETTINGS, PLUGIN_STYLES } from './constants';
import { TypeService } from './type-service';
import { RelationshipService } from './relationship-service';
import { ProjectMenuManager } from './project-menu-manager';
import { TPSProjectsSettingTab } from './settings-tab';

export default class TPSProjectsPlugin extends Plugin {
    settings: TPSProjectsSettings = DEFAULT_SETTINGS;
    typeService!: TypeService;
    relationshipService!: RelationshipService;
    projectMenuManager!: ProjectMenuManager;

    private styleEl: HTMLStyleElement | null = null;
    private debouncedEnsureMenus: () => void;

    async onload() {
        await this.loadSettings();

        // Initialize services
        this.typeService = new TypeService(this);
        this.relationshipService = new RelationshipService(this);
        this.projectMenuManager = new ProjectMenuManager(this);

        // Inject styles
        this.injectStyles();

        // Debounced menu refresh (longer debounce for performance)
        this.debouncedEnsureMenus = debounce(() => {
            this.projectMenuManager.ensureMenus();
        }, 200, true);

        // Register workspace events
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.debouncedEnsureMenus();
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.debouncedEnsureMenus();
            })
        );

        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                this.debouncedEnsureMenus();
            })
        );

        // Listen for metadata changes to refresh menus (debounced)
        const debouncedRefresh = debounce((file: any) => {
            this.projectMenuManager.refreshMenusForFile(file);
        }, 300, true);

        this.registerEvent(
            this.app.metadataCache.on('changed', debouncedRefresh)
        );

        // Listen for vault changes to invalidate type cache (debounced)
        const debouncedInvalidate = debounce(() => {
            this.typeService.invalidateCache();
        }, 500, true);

        this.registerEvent(
            this.app.vault.on('create', (file) => {
                if (file.path.includes('/')) {
                    debouncedInvalidate();
                }
            })
        );

        this.registerEvent(
            this.app.vault.on('delete', debouncedInvalidate)
        );

        this.registerEvent(
            this.app.vault.on('rename', debouncedInvalidate)
        );

        // Add settings tab
        this.addSettingTab(new TPSProjectsSettingTab(this.app, this));

        // Defer initial menu setup to avoid blocking startup
        this.app.workspace.onLayoutReady(() => {
            // Use setTimeout to allow other startup tasks to complete first
            setTimeout(() => {
                this.typeService.refreshCache();
                this.projectMenuManager.ensureMenus();
                this.log('TPS Projects plugin loaded');
            }, 500);
        });
    }

    onunload() {
        this.projectMenuManager.detach();
        this.removeStyles();
        this.log('TPS Projects plugin unloaded');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // Refresh styles when settings change
        this.refreshStyles();
        // Refresh menus when settings change
        this.projectMenuManager.ensureMenus();
    }

    private injectStyles(): void {
        if (this.styleEl) return;
        this.styleEl = document.createElement('style');
        this.styleEl.id = 'tps-projects-styles';
        this.styleEl.textContent = PLUGIN_STYLES;
        document.head.appendChild(this.styleEl);
    }

    /**
     * Refresh styles (called when settings change)
     */
    refreshStyles(): void {
        if (this.styleEl) {
            this.styleEl.textContent = PLUGIN_STYLES;
        }
    }

    private removeStyles(): void {
        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }
    }

    private log(...args: any[]): void {
        if (this.settings.enableLogging) {
            console.log('[TPS Projects]', ...args);
        }
    }
}

