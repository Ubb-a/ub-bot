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
        activities: [{ name: 'خرائط الطريق | !help', type: 0 }],
        status: 'online'
    });
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
                { name: '!addtask', value: 'إضافة مهمة جديدة', inline: true },
                { name: '!tasks', value: 'عرض المهام مع الأرقام', inline: true },
                { name: '!done', value: 'إنهاء مهمة بالرقم', inline: true },
                { name: '!taskstats', value: 'إحصائيات المهام (إداري)', inline: true },
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
        // Handle unknown commands with helpful suggestions
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const availableCommands = Array.from(client.commands.keys()).slice(0, 5);
        const suggestionEmbed = new EmbedBuilder()
            .setColor(COLORS.YELLOW)
            .setTitle('❓ أمر غير معروف')
            .setDescription(`الأمر \`!${commandName}\` غير موجود.\n\n**الأوامر المتاحة:**\n${availableCommands.map(cmd => `\`!${cmd}\``).join(', ')}\n\nاكتب \`!help\` لعرض دليل الأوامر الكامل.`)
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
            .setTitle('❌ خطأ في الأمر')
            .setDescription('حدث خطأ أثناء تنفيذ الأمر. يرجى المحاولة مرة أخرى.')
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