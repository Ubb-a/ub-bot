# Discord Roadmap Bot

## Overview

This is a Discord bot application designed to manage role-based roadmaps within Discord servers. The bot allows users with appropriate permissions to create and manage learning/development roadmaps that are accessible only to users with specific roles. Built with Node.js, Discord.js v14, and Express for keep-alive functionality.

## System Architecture

### Backend Architecture
- **Node.js Runtime**: Core JavaScript runtime environment
- **Discord.js v14**: Primary Discord API wrapper for bot functionality
- **Express Server**: HTTP server for health checks and status monitoring
- **File-based Storage**: JSON file system for data persistence

### Command System
- **Modular Command Structure**: Commands are organized in separate files within a `/commands` directory
- **Permission-based Access**: Role-based permission system for roadmap management
- **Collection-based Command Loading**: Dynamic command loading using Discord.js Collections

### Data Management
- **JSON File Storage**: Simple file-based data persistence using `data.json`
- **Utility Layer**: Centralized data management through `utils/dataManager.js`
- **Roadmap Structure**: Guild-scoped roadmaps with role-based access control

## Key Components

### Bot Core (`bot.js`)
- Discord client initialization with necessary gateway intents
- Command collection and dynamic loading system
- Message event handling for command processing
- Bot presence and activity management

### Web Server (`server.js`)
- Express HTTP server for external monitoring
- Health check endpoints (`/` and `/status`)
- Bot status reporting with guild and data statistics
- Keep-alive functionality for hosting platforms

### Data Management (`utils/dataManager.js`)
- JSON file-based storage operations
- Roadmap CRUD operations
- Data integrity and error handling
- Statistics and analytics functions

### Embed Builder (`utils/embedBuilder.js`)
- Standardized Discord embed creation
- Consistent color scheme using Discord brand colors
- Success, error, and info embed templates
- Reusable embed components for consistent UI

### Commands
- **create**: Role-restricted roadmap creation with permission validation
- **myroadmaps**: User-specific roadmap listing based on role access
- **showroadmap**: Detailed roadmap display with access control

## Data Flow

1. **Command Processing**: Messages with `!` prefix are parsed and routed to appropriate command handlers
2. **Permission Validation**: Role-based access control checks before executing sensitive operations
3. **Data Operations**: JSON file read/write operations through the data manager utility
4. **Response Generation**: Embed-based responses with consistent formatting and error handling
5. **Guild Scoping**: All roadmaps are scoped to specific Discord guilds for multi-server support

## External Dependencies

### Core Dependencies
- **discord.js**: Discord API wrapper for bot functionality
- **express**: Web server framework for monitoring endpoints
- **dotenv**: Environment variable management for sensitive configuration

### System Dependencies
- **Node.js 20**: Runtime environment specified in Replit configuration
- **File System**: Native fs module for JSON data persistence

## Deployment Strategy

### Replit Configuration
- **Module**: nodejs-20 for modern Node.js runtime
- **Workflow**: Parallel execution of Discord bot and web server
- **Auto-install**: Automatic dependency installation via npm
- **Port Configuration**: Express server on configurable port (default 3000)

### Environment Setup
- **Environment Variables**: Bot token and configuration through `.env` file
- **Automatic Initialization**: Data file creation on first run
- **Health Monitoring**: HTTP endpoints for external monitoring and keep-alive

### Hosting Considerations
- **Keep-alive Server**: Express server prevents bot from sleeping on free hosting
- **Memory Management**: In-memory command collection with file-based data persistence
- **Error Handling**: Graceful error handling for network and file system operations

## Recent Changes

- **June 25, 2025**: Complete Discord roadmap bot implementation
  - Built role-based roadmap management system
  - Implemented command handlers (!create, !myroadmaps, !showroadmap, !help)
  - Added JSON data persistence with backup functionality
  - Configured Express web server for monitoring and API endpoints
  - Successfully connected Discord bot with proper intents
  - Bot is online and serving Discord servers

## Changelog

```
Changelog:
- June 25, 2025. Complete Discord bot with roadmap management
- June 25, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```