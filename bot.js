const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Create a collection to store commands
client.commands = new Collection();

// Load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}

// Bot ready event
client.once('ready', () => {
    console.log(`🤖 ${client.user.tag} is online and ready!`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    // Set bot activity
    client.user.setActivity('roadmaps | !help', { type: 'WATCHING' });
});

// Message handler for commands
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Check if message starts with !
    if (!message.content.startsWith('!')) return;

    // If user just types "!" show available commands
    if (message.content.trim() === '!') {
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const commandsEmbed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('📋 الأوامر المتاحة')
            .setDescription('اكتب أي من هذه الأوامر:')
            .addFields(
                { name: '!help', value: 'عرض دليل المساعدة الكامل', inline: true },
                { name: '!create', value: 'إنشاء خريطة طريق جديدة', inline: true },
                { name: '!myroadmaps', value: 'عرض خرائطك المتاحة', inline: true },
                { name: '!showroadmap', value: 'عرض تفاصيل خريطة معينة', inline: true }
            )
            .setFooter({ text: 'اكتب !help للحصول على شرح مفصل' })
            .setTimestamp();
            
        return message.reply({ embeds: [commandsEmbed] }).catch(() => {});
    }

    // Parse command and arguments
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Get command from collection
    const command = client.commands.get(commandName);
    if (!command) {
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const unknownEmbed = new EmbedBuilder()
            .setColor(COLORS.YELLOW)
            .setTitle('❓ أمر غير معروف')
            .setDescription(`الأمر \`!${commandName}\` غير موجود.\n\nاستخدم \`!\` لرؤية الأوامر المتاحة أو \`!help\` للمساعدة.`)
            .setTimestamp();
            
        return message.reply({ embeds: [unknownEmbed] }).catch(() => {});
    }

    try {
        // Execute command
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        const errorEmbed = new EmbedBuilder()
            .setColor(COLORS.RED)
            .setTitle('❌ خطأ في الأمر')
            .setDescription('حدث خطأ أثناء تنفيذ هذا الأمر. حاول مرة أخرى.')
            .setTimestamp();
        
        return message.reply({ embeds: [errorEmbed] }).catch(() => {});
    }
});

// Error handling
client.on('error', error => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Login to Discord
const token = process.env.DISCORD_TOKEN;
if (!token) {
    console.error('❌ No Discord token found. Please set DISCORD_TOKEN environment variable.');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});

module.exports = client;
