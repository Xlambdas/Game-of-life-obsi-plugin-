# Life RPG Plugin

## Description
This project is a plugin for Obsidian that transforms your life into an RPG game. It includes a quest system, levels, XP, classes, and skills.

## Installation
1. Clone the repository into the Obsidian plugins directory.
2. accept the use of the plugin in your vault Obsidian.

## Files
### index.js
This file sets up and starts the HTTP server for the API.

### sidebar.js
This file contains the logic to manage levels in the plugin.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue to discuss the changes you want to make.

## License
This project is licensed under the MIT License.

## Features
- **Quest System**: Define and manage quests.
- **Levels and XP**: Track levels and experience points.
- **Classes and Skills**: Define character classes and skills.

## Future Enhancements
- **Inventory System**: Manage items and equipment.
- **Achievements**: Track and display achievements.
- **Multiplayer Support**: Allow multiple users to interact.

## Missing Information
- Detailed setup instructions for the quest system.
- Examples of how to define and manage classes and skills.
- Information on how to integrate with other Obsidian plugins.

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
