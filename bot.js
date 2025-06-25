const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Initialize commands collection
client.commands = new Collection();

// Load commands from commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📂 Loading commands...');
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        console.log(`✅ Loaded command: ${command.name}`);
    } else {
        console.log(`⚠️ Command ${file} is missing required properties`);
    }
}

// Bot ready event
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot presence
    client.user.setPresence({
        activities: [{ name: 'Roadmaps | !help', type: 0 }],
        status: 'online'
    });
});

// Message handler for commands
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message starts with ! or is a direct command
    const hasPrefix = message.content.startsWith('!');
    const isDirectCommand = client.commands.has(message.content.split(' ')[0].toLowerCase());
    
    if (!hasPrefix && !isDirectCommand) return;

    // If user just types "!" show available commands
    if (message.content.trim() === '!' || message.content.trim() === 'help') {
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const commandsEmbed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('📋 Available Commands')
            .setDescription('Type any of these commands:')
            .addFields(
                { name: 'help', value: 'Show complete help guide', inline: true },
                { name: 'create', value: 'Create new roadmap', inline: true },
                { name: 'addtask', value: 'Add new task', inline: true },
                { name: 'tasks', value: 'Show tasks with numbers', inline: true },
                { name: 'done', value: 'Complete task by number', inline: true },
                { name: 'taskstats', value: 'Task statistics (admin)', inline: true },
                { name: 'myroadmaps', value: 'Show your available roadmaps', inline: true },
                { name: 'showroadmap', value: 'Show roadmap details', inline: true },
                { name: 'clear', value: 'Clear chat messages (admin)', inline: true },
                { name: 'dm', value: 'Send private message to role (admin)', inline: true },
                { name: 'deleteroadmap', value: 'Delete roadmap permanently (admin)', inline: true }
            )
            .setFooter({ text: 'Type help for detailed explanation or use commands without !' })
            .setTimestamp();
            
        return message.reply({ embeds: [commandsEmbed] }).catch(() => {});
    }

    // Parse command and arguments
    let content = message.content.trim();
    if (content.startsWith('!')) {
        content = content.slice(1);
    }
    const args = content.split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get command from collection
    const command = client.commands.get(commandName);
    
    if (!command) {
        // Handle unknown commands with helpful suggestions
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const availableCommands = Array.from(client.commands.keys()).slice(0, 5);
        const suggestionEmbed = new EmbedBuilder()
            .setColor(COLORS.YELLOW)
            .setTitle('❓ Unknown Command')
            .setDescription(`Command \`${commandName}\` doesn't exist.\n\n**Available commands:**\n${availableCommands.map(cmd => `\`${cmd}\``).join(', ')}\n\nType \`help\` to see the complete command guide.`)
            .setTimestamp();
        
        return message.reply({ embeds: [suggestionEmbed] }).catch(() => {});
    }

    // Execute command with error handling
    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const errorEmbed = new EmbedBuilder()
            .setColor(COLORS.RED)
            .setTitle('❌ Command Error')
            .setDescription('An error occurred while executing the command. Please try again.')
            .setTimestamp();
        
        message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
});

// Error handling
client.on('error', console.error);
client.on('warn', console.warn);

// Start the bot
if (process.env.DISCORD_TOKEN) {
    client.login(process.env.DISCORD_TOKEN).catch(console.error);
} else {
    console.error('❌ DISCORD_TOKEN environment variable is not set');
}

module.exports = client;