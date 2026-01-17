import { TPSProjectsSettings } from './types';

export const DEFAULT_SETTINGS: TPSProjectsSettings = {
  enableLogging: false,
  attachmentKey: 'attachments',
  typeDepth: 'leaf',
  excludedFolders: ['System', '.obsidian', '.trash'],
  typeFolders: ['01 Action Items', '02 Pages'],
  showInReadingView: true,
  showInLivePreview: true,
  badgeProperties: ['status', 'priority'],
};

/**
 * CSS styles for the plugin
 */
export const PLUGIN_STYLES = `
  /* TPS Projects Menu Container */
  .tps-projects-menu {
    position: static;
    background: transparent;
    border: none;
    box-shadow: none;
    width: 100%;
    max-width: 100%;
    padding: 0;
    margin-bottom: 1em;
  }

  .tps-projects-menu--live {
    position: fixed;
    bottom: calc(70px + env(safe-area-inset-bottom, 0px));
    left: 0;
    right: 0;
    margin-left: auto;
    margin-right: auto;
    z-index: 99;
    padding: 8px 12px;
    width: min(92vw, 420px);
    max-width: calc(100vw - 24px);
    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Header */
  .tps-projects-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    cursor: pointer;
    user-select: none;
  }

  .tps-projects-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tps-projects-header-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }

  .tps-projects-header-count {
    font-size: 10px;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 1px 6px;
    border-radius: 10px;
  }

  .tps-projects-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Collapse Button */
  .tps-projects-collapse-btn {
    min-width: 24px;
    min-height: 24px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    padding: 0;
    transition: all 0.15s ease;
  }

  .tps-projects-collapse-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }

  .tps-projects-collapse-btn svg {
    width: 12px;
    height: 12px;
    transition: transform 0.2s ease;
  }

  .tps-projects-menu--collapsed .tps-projects-collapse-btn svg {
    transform: rotate(-90deg);
  }

  /* Add Button */
  .tps-projects-add-btn {
    padding: 2px 8px;
    font-size: 11px;
    border-radius: 4px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-primary);
    color: var(--text-muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s ease;
  }

  .tps-projects-add-btn:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
    border-color: var(--interactive-accent);
  }

  /* Attached Notes List */
  .tps-projects-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 0 0;
    border-left: 2px solid var(--background-modifier-border);
    margin-left: 4px;
    padding-left: 12px;
  }

  .tps-projects-menu--collapsed .tps-projects-list {
    display: none;
  }

  /* Note Item */
  .tps-projects-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .tps-projects-item:hover {
    background: var(--background-modifier-hover);
  }

  .tps-projects-item-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .tps-projects-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .tps-projects-item-icon svg {
    width: 14px;
    height: 14px;
  }

  .tps-projects-item-title {
    font-size: 13px;
    color: var(--text-normal);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tps-projects-item-type {
    font-size: 10px;
    color: var(--text-faint);
    background: var(--background-modifier-hover);
    padding: 1px 4px;
    border-radius: 3px;
  }

  /* Badge Container */
  .tps-projects-item-badges {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  /* Badge Styles (matching TPS-Global-Context-Menu) */
  .tps-projects-badge {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .tps-projects-badge-status {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }

  .tps-projects-badge-open { background: hsla(200, 50%, 30%, 0.4); color: hsl(200, 60%, 75%); }
  .tps-projects-badge-working { background: hsla(45, 50%, 30%, 0.4); color: hsl(45, 60%, 75%); }
  .tps-projects-badge-blocked { background: hsla(0, 50%, 30%, 0.4); color: hsl(0, 60%, 75%); }
  .tps-projects-badge-complete { background: hsla(120, 50%, 30%, 0.4); color: hsl(120, 60%, 75%); }
  .tps-projects-badge-wont-do { background: hsla(270, 30%, 30%, 0.4); color: hsl(270, 40%, 75%); }

  .tps-projects-badge-priority {
    background: var(--background-modifier-hover);
    color: var(--text-muted);
  }

  .tps-projects-badge-high { background: hsla(0, 60%, 30%, 0.4); color: hsl(0, 70%, 75%); }
  .tps-projects-badge-medium { background: hsla(30, 50%, 30%, 0.4); color: hsl(30, 60%, 75%); }
  .tps-projects-badge-normal { background: hsla(210, 30%, 30%, 0.4); color: hsl(210, 40%, 75%); }
  .tps-projects-badge-low { background: hsla(180, 30%, 30%, 0.4); color: hsl(180, 40%, 75%); }

  /* Empty State */
  .tps-projects-empty {
    font-size: 12px;
    color: var(--text-faint);
    font-style: italic;
    padding: 8px 0;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .tps-projects-menu--live {
      bottom: calc(100px + env(safe-area-inset-bottom, 0px));
      width: calc(100vw - 32px);
    }

    .tps-projects-item-badges {
      flex-wrap: wrap;
    }
  }

  /* Hidden for keyboard on mobile */
  .tps-projects-hidden-for-keyboard .tps-projects-menu--live {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
  }

  /* Clickable title */
  .tps-projects-item-title--clickable {
    cursor: pointer;
    border-radius: 3px;
    padding: 2px 4px;
    margin: -2px -4px;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .tps-projects-item-title--clickable:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  /* Clickable badge */
  .tps-projects-badge--clickable {
    cursor: pointer;
    transition: filter 0.15s ease, transform 0.1s ease;
  }

  .tps-projects-badge--clickable:hover {
    filter: brightness(1.2);
    transform: scale(1.05);
  }

  /* Parent Notes Section (above inline title) */
  .tps-projects-parents {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    margin-bottom: 4px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .tps-projects-parents-label {
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 600;
    color: var(--text-faint);
    letter-spacing: 0.05em;
  }

  .tps-projects-parent-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: var(--background-modifier-hover);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .tps-projects-parent-link:hover {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
  }

  /* Create Note Modal */
  .tps-projects-create-modal .setting-item {
    border-top: none;
  }

  .tps-projects-create-modal-subtitle {
    font-size: 12px;
    color: var(--text-faint);
    margin-top: -8px;
    margin-bottom: 16px;
  }

  .tps-projects-body-container {
    margin-top: -8px;
    margin-bottom: 12px;
  }
`;
