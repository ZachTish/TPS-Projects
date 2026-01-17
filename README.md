# TPS Projects

**A powerful project management plugin for Obsidian that creates different types of notes and displays attached notes in an inline menu bar for easy access.**

![Obsidian Plugin](https://img.shields.io/badge/dynamic/json-blue?label=Obsidian%20Plugin&query=version)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/github/workflows/CI/TPS-Projects)

## ✨ Features

### 🗂️ Smart Project Organization
- **Automatic Type Detection**: Automatically identifies note types based on folder structure
- **Configurable Types**: Define your own note categories and folders
- **Relationship Mapping**: Link related notes and projects together
- **Badge System**: Visual indicators for status, priority, and custom properties

### 📋 Inline Menu Bar
- **Quick Access**: Access attached notes from any document
- **Smart Filtering**: Filter notes by type, status, or custom properties
- **Debounced Updates**: Optimized performance with smart caching
- **Real-time Sync**: Updates automatically as you work

### ⚙️ Customizable Settings
- **Flexible Scanning**: Choose which folders to scan or exclude
- **Property Mapping**: Define custom frontmatter keys for attachments
- **Depth Control**: Scan all folders or just leaf folders
- **Visual Badges**: Configure which properties to display as badges

## 🚀 Installation

### Via BRAT (Recommended for Testing)
1. Install the [BRAT plugin](https://github.com/TfTHacker/obsidian42-brat) in Obsidian
2. Go to Settings → Community Plugins → Add BRAT plugin
3. Add this repository URL: `https://github.com/ZachTish/TPS-Projects`
4. Enable "TPS Projects" in your installed plugins

### Via Release (Stable)
1. Download the latest [release](https://github.com/ZachTish/TPS-Projects/releases)
2. Extract the contents to your vault's plugins folder
3. Restart Obsidian and enable the plugin

## 📖 Usage

### Basic Setup

1. **Configure Plugin**: Go to Settings → TPS Projects
2. **Set Up Folders**: Define which folders contain your project types
3. **Configure Attachments**: Choose the frontmatter key for note relationships
4. **Enable Features**: Select which properties to show as badges

### Creating Projects

#### Folder Structure Method
```
Projects/
├── Active/
│   ├── Project-A.md
│   └── Project-B.md
├── Archived/
│   └── Old-Project.md
└── Ideas/
    └── Future-Project.md
```

#### Frontmatter Method
```yaml
---
type: active
status: in-progress
priority: high
attachments:
  - Related-Note.md
  - Task-List.md
---
```

### Using the Menu Bar

1. **Open any note** in your vault
2. **Look for the inline menu** that appears (usually near the top)
3. **Click on attached notes** to quickly navigate between related items
4. **Use badges** to quickly see status and priority information

### Advanced Features

#### Note Relationships
- **Bidirectional Links**: Notes can reference each other automatically
- **Type Filtering**: Only show relationships between specific note types
- **Dynamic Updates**: Relationships update as you add/remove attachments

#### Badge System
- **Status Badges**: `🟢 Active`, `🟡 Blocked`, `🔴 Urgent`
- **Priority Badges**: `🔴 High`, `🟡 Medium`, `🟢 Low`
- **Custom Properties**: Any frontmatter can be displayed as a badge

## ⚙️ Settings

### Main Settings
- **Attachment Key**: Frontmatter key for note relationships (default: "attachments")
- **Type Depth**: Scan all folders or just leaf folders
- **Excluded Folders**: Folders to ignore during scanning
- **Type Folders**: Root folders that contain different note types

### Visual Settings
- **Show in Reading View**: Display menu in reading mode
- **Show in Live Preview**: Display menu during live preview
- **Badge Properties**: Which frontmatter fields to show as badges

### Advanced Settings
- **Enable Logging**: Debug mode for troubleshooting
- **Performance Options**: Debounce timing and cache settings

## 🎯 Use Cases

### **Project Management**
- Track multiple projects with different states
- Quickly navigate between related project documents
- Visual status indicators for project health

### **Knowledge Management**
- Link research notes to main topics
- Create knowledge graphs with visual connections
- Filter and navigate large knowledge bases

### **Task Management**
- Attach task lists to project notes
- Track status and priority visually
- Quick access to reference materials

## 🔧 Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/ZachTish/TPS-Projects.git
cd TPS-Projects

# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes during development
npm run dev
```

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request against the `develop` branch

## 📋 Changelog

### v1.0.0 (2024-01-17)
- ✅ Initial release
- ✅ Basic project type detection
- ✅ Inline menu bar functionality
- ✅ Configuration settings
- ✅ Badge system implementation

## 🐛 Troubleshooting

### Common Issues

#### Menu Not Appearing
- Check that the plugin is enabled in Settings → Community Plugins
- Verify your folders are correctly configured in plugin settings
- Try refreshing Obsidian with Ctrl+R (or Cmd+R on Mac)

#### Relationships Not Working
- Ensure your frontmatter contains the attachment key
- Check that attached files exist in your vault
- Verify the attachment key matches your settings configuration

#### Performance Issues
- Reduce the number of type folders being scanned
- Enable the "leaf only" option for type depth
- Disable badges for unused properties

### Debug Mode
Enable logging in plugin settings to see detailed information about:
- Folder scanning progress
- Type detection results
- Menu creation events
- Error messages and warnings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 🔗 Links

- **Repository**: https://github.com/ZachTish/TPS-Projects
- **Issues**: https://github.com/ZachTish/TPS-Projects/issues
- **Discussions**: https://github.com/ZachTish/TPS-Projects/discussions
- **Releases**: https://github.com/ZachTish/TPS-Projects/releases

---

**Made with ❤️ for the Obsidian community**