import { App, TFolder } from 'obsidian';
import type TPSProjectsPlugin from './main';
import { NoteType } from './types';

/**
 * Service for discovering and managing note types based on folder structure
 */
export class TypeService {
    plugin: TPSProjectsPlugin;
    private typeCache: NoteType[] = [];
    private cacheValid = false;

    constructor(plugin: TPSProjectsPlugin) {
        this.plugin = plugin;
    }

    get app(): App {
        return this.plugin.app;
    }

    /**
     * Get all discovered types (cached)
     */
    getAllTypes(): NoteType[] {
        if (!this.cacheValid) {
            this.refreshCache();
        }
        return this.typeCache;
    }

    /**
     * Get type for a specific folder path
     */
    getTypeForPath(path: string): NoteType | null {
        const types = this.getAllTypes();
        return types.find(t => t.path === path) || null;
    }

    /**
     * Get type by folder basename
     */
    getTypeByName(name: string): NoteType | null {
        const types = this.getAllTypes();
        return types.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
    }

    /**
     * Check if a folder path should be excluded
     */
    isExcluded(path: string): boolean {
        const excluded = this.plugin.settings.excludedFolders || [];
        return excluded.some(ex => {
            const normalizedEx = ex.trim();
            if (!normalizedEx) return false;
            return path === normalizedEx || path.startsWith(normalizedEx + '/');
        });
    }

    /**
     * Scan folders and rebuild the type cache
     */
    refreshCache(): void {
        this.typeCache = [];
        const typeFolders = this.plugin.settings.typeFolders || [];
        const depth = this.plugin.settings.typeDepth || 'leaf';

        for (const rootPath of typeFolders) {
            const rootFolder = this.app.vault.getAbstractFileByPath(rootPath);
            if (rootFolder instanceof TFolder) {
                this.scanFolder(rootFolder, depth);
            }
        }

        this.cacheValid = true;
        this.log(`Type cache refreshed: ${this.typeCache.length} types found`);
    }

    /**
     * Mark cache as invalid (call when folders change)
     */
    invalidateCache(): void {
        this.cacheValid = false;
    }

    /**
     * Recursively scan a folder for types
     */
    private scanFolder(folder: TFolder, depth: 'all' | 'leaf'): void {
        if (this.isExcluded(folder.path)) {
            return;
        }

        const subfolders = folder.children.filter(
            (child): child is TFolder => child instanceof TFolder && !this.isExcluded(child.path)
        );

        if (depth === 'all') {
            // Every folder is a type
            this.addType(folder);
            for (const sub of subfolders) {
                this.scanFolder(sub, depth);
            }
        } else {
            // 'leaf' mode - only folders with no subfolders are types
            if (subfolders.length === 0) {
                this.addType(folder);
            } else {
                for (const sub of subfolders) {
                    this.scanFolder(sub, depth);
                }
            }
        }
    }

    /**
     * Add a folder as a type
     */
    private addType(folder: TFolder): void {
        const type: NoteType = {
            id: folder.path,
            name: folder.name,
            path: folder.path,
        };
        this.typeCache.push(type);
    }

    /**
     * Get icon for a type (could be extended later)
     */
    getTypeIcon(type: NoteType): string {
        // Default icons based on common folder names
        const name = type.name.toLowerCase();
        if (name.includes('project')) return 'folder-kanban';
        if (name.includes('todo') || name.includes('task')) return 'check-square';
        if (name.includes('event')) return 'calendar';
        if (name.includes('reference')) return 'book-open';
        if (name.includes('topic') || name.includes('brainstorm')) return 'lightbulb';
        if (name.includes('keep') || name.includes('mind')) return 'brain';
        if (name.includes('thing') || name.includes('list')) return 'list';
        return 'file-text';
    }

    private log(...args: any[]): void {
        if (this.plugin.settings.enableLogging) {
            console.log('[TPS Projects]', ...args);
        }
    }
}
