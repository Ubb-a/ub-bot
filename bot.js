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

// Track recent responses to prevent duplicates
const recentResponses = new Set();

// Function to check if user has been active recently
async function checkIfUserActiveRecently(channel, userId) {
    try {
        const messages = await channel.messages.fetch({ limit: 50 });
        const twoMinutesAgo = Date.now() - (2 * 60 * 1000); // 2 minutes ago
        
        // Check if user sent any message in the last 2 minutes
        const recentMessage = messages.find(msg => 
            msg.author.id === userId && msg.createdTimestamp > twoMinutesAgo
        );
        
        return !!recentMessage;
    } catch (error) {
        console.error('Error checking user activity:', error);
        return false; // If we can't check, assume not active
    }
}

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
        activities: [{ name: 'السمكري هنا علشان يسمكر الدنيا و يهندسها عد معايا عدد 1 شاي و هندل الدنيا ب help', type: 0 }],
        status: 'online'
    });
});

// Message handler for commands
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check for "يا سمكري" command
    if (message.content.toLowerCase().includes('يا سمكري')) {
        try {
            const { EmbedBuilder } = require('discord.js');
            const { COLORS } = require('./utils/embedBuilder');
            
            const commandList = Array.from(client.commands.keys()).map(cmd => `\`${cmd}\``).join(', ');
            
            const embed = new EmbedBuilder()
                .setColor(COLORS.BLUE)
                .setTitle('🔧 يا قلب السمكري - الكوماندات اهي')
                .setDescription(`**الكوماندات المتاحة:**\n${commandList}\n\n**للمساعدة التفصيلية:** \`help\``)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error replying to يا سمكري:', error);
        }
        return;
    }
    
    // Check for "زعزوع" mention and respond only if ub.d is offline
    if (message.content.toLowerCase().includes('زعزوع')) {
        try {
            // Create unique identifier for this message to prevent duplicates
            const messageId = `${message.guild.id}-${message.channel.id}-${Date.now()}`;
            
            // Check if we already responded recently (within 5 seconds)
            if (recentResponses.has(message.channel.id)) {
                return;
            }
            
            // Try to find ub.d user in the server
            const ubdUser = message.guild.members.cache.find(member => 
                member.user.username.toLowerCase().includes('ub.d') || 
                member.displayName.toLowerCase().includes('ub.d')
            );
            
            // Check if ub.d is active in the channel recently (last 2 minutes)
            const isUbdActive = ubdUser && await checkIfUserActiveRecently(message.channel, ubdUser.user.id);
            
            // Only respond if ub.d is not found or not active recently
            if (!ubdUser || !isUbdActive) {
                // Add to recent responses to prevent duplicates
                recentResponses.add(message.channel.id);
                
                // Remove from set after 10 seconds
                setTimeout(() => {
                    recentResponses.delete(message.channel.id);
                }, 10000);
                
                const mentionText = ubdUser ? `<@${ubdUser.user.id}>` : '@ub.d';
                await message.reply(`سيبوه في حاله الراجل نايم او تعبان او ايه مش فاكر كان قايلي ايه بس علي العموم هيرد اول ما يرجع ${mentionText}`);
            }
        } catch (error) {
            console.error('Error replying to زعزوع mention:', error);
        }
        return;
    }
    
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
                { name: 'bulkaddtask', value: 'Add multiple tasks at once', inline: true },
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

// Start the keep-alive server
require("./keep_alive");

// Start the bot
if (process.env.DISCORD_TOKEN) {
    client.login(process.env.DISCORD_TOKEN).catch(console.error);
} else {
    console.error('❌ DISCORD_TOKEN environment variable is not set');
}

module.exports = client;