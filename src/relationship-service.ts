import { App, TFile, normalizePath } from 'obsidian';
import type TPSProjectsPlugin from './main';
import { AttachedNote, NoteType } from './types';

/**
 * Service for managing note relationships (attachments)
 */
export class RelationshipService {
    plugin: TPSProjectsPlugin;

    constructor(plugin: TPSProjectsPlugin) {
        this.plugin = plugin;
    }

    get app(): App {
        return this.plugin.app;
    }

    /**
     * Get all notes that are attached to the given parent note.
     * Searches for notes where the attachment frontmatter links to this note.
     */
    getAttachedNotes(parentFile: TFile): AttachedNote[] {
        const attachmentKey = this.plugin.settings.attachmentKey || 'attachments';
        const parentName = parentFile.basename;
        const parentPath = parentFile.path;
        const results: AttachedNote[] = [];

        this.log(`Searching for notes attached to: "${parentName}" (${parentPath})`);

        const files = this.app.vault.getMarkdownFiles();

        for (const file of files) {
            if (file.path === parentPath) continue; // Skip self

            const cache = this.app.metadataCache.getFileCache(file);
            const fm = cache?.frontmatter;
            if (!fm) continue;

            const attachmentValue = fm[attachmentKey];
            if (!attachmentValue) continue;

            // Check if this file is attached to the parent
            const attachments = Array.isArray(attachmentValue) ? attachmentValue : [attachmentValue];

            for (const attachment of attachments) {
                // Skip non-string values
                if (typeof attachment !== 'string') continue;

                this.log(`Checking file "${file.basename}": ${attachmentKey}="${attachment}"`);

                if (this.matchesLink(attachment, parentName, parentPath)) {
                    const type = this.plugin.typeService.getTypeForPath(file.parent?.path || '');
                    this.log(`  -> MATCHED! Adding "${file.basename}" to results`);
                    results.push({
                        file,
                        type,
                        frontmatter: fm || {},
                    });
                    break; // Found a match, no need to check other attachments
                }
            }
        }

        this.log(`Found ${results.length} attached notes for "${parentName}"`);

        // Sort by name
        results.sort((a, b) => a.file.basename.localeCompare(b.file.basename));

        return results;
    }

    /**
     * Get the parent note this file is attached to
     */
    getParentNote(file: TFile): TFile | null {
        const parents = this.getAllParentNotes(file);
        return parents.length > 0 ? parents[0] : null;
    }

    /**
     * Get all parent notes this file is attached to (supports multiple parents)
     */
    getAllParentNotes(file: TFile): TFile[] {
        const attachmentKey = this.plugin.settings.attachmentKey || 'attachments';
        const cache = this.app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        if (!fm) return [];

        const attachmentValue = fm[attachmentKey];
        if (!attachmentValue) return [];

        const attachments = Array.isArray(attachmentValue) ? attachmentValue : [attachmentValue];
        const parents: TFile[] = [];

        for (const attachment of attachments) {
            if (typeof attachment !== 'string') continue;

            // Extract note name from wikilink
            const linkMatch = attachment.match(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/);
            const noteName = linkMatch ? linkMatch[1].trim() : attachment;

            // Find the file
            const linkedFile = this.app.metadataCache.getFirstLinkpathDest(noteName, file.path);
            if (linkedFile instanceof TFile) {
                parents.push(linkedFile);
            }
        }

        return parents;
    }

    /**
     * Attach a note to a parent (updates frontmatter)
     */
    async attachNote(child: TFile, parent: TFile): Promise<void> {
        const attachmentKey = this.plugin.settings.attachmentKey || 'attachments';
        const linkText = `[[${parent.basename}]]`;

        await this.app.fileManager.processFrontMatter(child, (fm) => {
            fm[attachmentKey] = linkText;
        });

        this.log(`Attached "${child.basename}" to "${parent.basename}"`);
    }

    /**
     * Detach a note from its parent
     */
    async detachNote(child: TFile): Promise<void> {
        const attachmentKey = this.plugin.settings.attachmentKey || 'attachments';

        await this.app.fileManager.processFrontMatter(child, (fm) => {
            delete fm[attachmentKey];
        });

        this.log(`Detached "${child.basename}"`);
    }

    /**
     * Create a new note and attach it to the parent.
     * Uses a two-step process to allow Templater to apply folder templates.
     */
    async createAttachedNote(
        parent: TFile,
        type: NoteType,
        title: string,
        options: { body?: string; status?: string; priority?: string } = {}
    ): Promise<TFile> {
        const attachmentKey = this.plugin.settings.attachmentKey || 'attachments';
        const { body = '', status = 'open', priority = 'normal' } = options;

        // Generate file path
        const filename = `${title}.md`;
        const filePath = normalizePath(`${type.path}/${filename}`);

        // Check if file already exists
        const existing = this.app.vault.getAbstractFileByPath(filePath);
        if (existing) {
            throw new Error(`File already exists: ${filePath}`);
        }

        // Get the folder
        const folder = this.app.vault.getAbstractFileByPath(type.path);

        // Try to use Templater's file creation if available
        // @ts-ignore - Templater API
        const templaterPlugin = this.app.plugins.plugins['templater-obsidian'];

        let newFile: TFile;

        if (templaterPlugin && templaterPlugin.templater) {
            this.log('Using Templater for file creation');
            try {
                // First create an empty file, Templater will apply folder templates automatically
                newFile = await this.app.vault.create(filePath, '');

                // Give Templater a moment to process the new file
                await new Promise(resolve => setTimeout(resolve, 100));

                // Templater should have already run. Now add our frontmatter.
                await this.app.fileManager.processFrontMatter(newFile, (fm) => {
                    fm.title = title;
                    fm[attachmentKey] = `[[${parent.basename}]]`;
                    if (!fm.status) fm.status = status;
                    if (!fm.priority) fm.priority = priority;
                });

                // Add body if provided
                if (body) {
                    const content = await this.app.vault.read(newFile);
                    await this.app.vault.modify(newFile, content + '\n' + body);
                }
            } catch (e) {
                this.log('Templater creation failed, using standard creation', e);
                // Fallback to standard creation
                const frontmatter = `---
title: ${title}
${attachmentKey}: "[[${parent.basename}]]"
status: ${status}
priority: ${priority}
---

${body}`;
                newFile = await this.app.vault.create(filePath, frontmatter);
            }
        } else {
            // Standard creation without Templater
            const frontmatter = `---
title: ${title}
${attachmentKey}: "[[${parent.basename}]]"
status: ${status}
priority: ${priority}
---

${body}`;
            newFile = await this.app.vault.create(filePath, frontmatter);
        }

        this.log(`Created attached note: ${filePath}`);
        return newFile;
    }

    /**
     * Check if a frontmatter value matches a link to the given note.
     * Only matches explicit wikilinks: [[Note Name]] or [[Note Name|Alias]]
     */
    private matchesLink(value: any, noteName: string, notePath: string): boolean {
        // Must be a string
        if (typeof value !== 'string') {
            return false;
        }

        // Must be a wikilink - we only support [[Note Name]] or [[Note Name|Alias]] format
        const linkMatch = value.match(/^\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]$/);
        if (!linkMatch) {
            // Not a valid wikilink format, skip
            return false;
        }

        const linkTarget = linkMatch[1].trim();

        // Exact match by basename
        if (linkTarget === noteName) {
            this.log(`Matched: "${linkTarget}" === "${noteName}"`);
            return true;
        }

        // Match by full path (without .md extension)
        const notePathWithoutExt = notePath.replace(/\.md$/, '');
        if (linkTarget === notePathWithoutExt) {
            this.log(`Matched path: "${linkTarget}" === "${notePathWithoutExt}"`);
            return true;
        }

        return false;
    }

    private log(...args: any[]): void {
        if (this.plugin.settings.enableLogging) {
            console.log('[TPS Projects]', ...args);
        }
    }
}
