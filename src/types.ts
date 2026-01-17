import { TFile } from 'obsidian';

/**
 * Plugin settings interface
 */
export interface TPSProjectsSettings {
    enableLogging: boolean;
    attachmentKey: string;           // Frontmatter key for linking (default: "attachments")
    typeDepth: 'all' | 'leaf';       // 'all' = every folder, 'leaf' = deepest only
    excludedFolders: string[];       // Folders to exclude from type detection
    typeFolders: string[];           // Root folders to scan
    showInReadingView: boolean;
    showInLivePreview: boolean;
    badgeProperties: string[];       // Properties to show as badges (e.g., ["status", "priority"])
}

/**
 * Represents a note type derived from folder structure
 */
export interface NoteType {
    id: string;                      // Unique identifier (folder path)
    name: string;                    // Display name (folder basename)
    path: string;                    // Full folder path
    icon?: string;                   // Optional icon
}

/**
 * An attached note with its type and frontmatter
 */
export interface AttachedNote {
    file: TFile;
    type: NoteType | null;
    frontmatter: Record<string, any>;
}

/**
 * Menu instances for a markdown view
 */
export interface MenuInstances {
    reading?: HTMLElement | null;
    live?: HTMLElement | null;
    filePath?: string;
}

/**
 * Frontmatter data structure
 */
export interface FrontmatterData {
    attachments?: string | string[];
    status?: string;
    priority?: string;
    title?: string;
    scheduled?: string;
    tags?: string | string[];
    [key: string]: any;
}
