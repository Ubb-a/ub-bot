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
    
    // Check if message starts with "يا سمكري" or is a direct command (no more ! prefix)
    const hasSamkariPrefix = message.content.toLowerCase().startsWith('يا سمكري');
    const isDirectCommand = client.commands.has(message.content.split(' ')[0].toLowerCase());
    
    if (!hasSamkariPrefix && !isDirectCommand) return;

    // If user just types "يا سمكري" or "help" show available commands
    if (message.content.trim().toLowerCase() === 'يا سمكري' || message.content.trim() === 'help') {
        try {
            const { EmbedBuilder } = require('discord.js');
            
            // Prevent duplicate responses
            const messageId = `${message.guild.id}-${message.channel.id}-samkari`;
            if (recentResponses.has(messageId)) {
                return;
            }
            recentResponses.add(messageId);
            setTimeout(() => recentResponses.delete(messageId), 3000);
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle('🔧 يا قلب السمكري - الأوامر اهي')
                .setDescription('**الأوامر الموجودة:**')
                .addFields(
                    { name: '📋 help', value: 'دليل المساعدة الكامل مع شرح كل أمر بالتفصيل', inline: false },
                    { name: '🗺️ create', value: 'عمل رود ماب جديدة للتعلم أو الشغل', inline: false },
                    { name: '✅ addtask', value: 'زود مهمة جديدة للرود ماب', inline: false },
                    { name: '📦 bulkaddtask', value: 'إضافة عدة مهام مرة واحدة (منفصلة بـ ,)', inline: false },
                    { name: '📝 tasks', value: 'شوف كل المهام بالأرقام عشان تتابع', inline: false },
                    { name: '✔️ done', value: 'خلص مهمة برقمها (زي: done 2)', inline: false },
                    { name: '📊 taskstats', value: 'إحصائيات المهام والمتابعة (للأدمن)', inline: false },
                    { name: '🗂️ myroadmaps', value: 'شوف الرود ماب الموجودة عندك', inline: false },
                    { name: '👁️ showroadmap', value: 'شوف تفاصيل رود ماب معينة', inline: false },
                    { name: '🧹 clear', value: 'امسح الرسايل من الشات (للأدمن)', inline: false },
                    { name: '💬 dm', value: 'ابعت رسالة خاصة لناس رتبة معينة (للأدمن)', inline: false },
                    { name: '🗑️ deleteroadmap', value: 'امسح رود ماب خالص (للأدمن)', inline: false },
                    { name: '📊 poll', value: 'عمل استطلاع رأي بخيارات متعددة (للأدمن)', inline: false },
                    { name: '🗳️ vote', value: 'عمل تصويت بسيط موافق/مش موافق (للأدمن)', inline: false },
                    { name: '📅 schedule', value: 'جدولة مهام أسبوعية للرود ماب (للأدمن)', inline: false }
                )
                .setFooter({ text: 'استعمل: يا سمكري [اسم الأمر] أو على طول [اسم الأمر]' })
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing commands:', error);
        }
        return;
    }

    // Parse command content
    let content = message.content;
    if (hasSamkariPrefix) {
        // Remove "يا سمكري " from the beginning
        content = content.toLowerCase().replace(/^يا سمكري\s*/, '').trim();
        if (!content) return; // If nothing after "يا سمكري", we already handled it above
    } else {
        content = content.trim(); // Direct command
    }

    // Parse command and arguments
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
            .setColor(0xFEE75C)
            .setTitle('❓ أمر مش معروف')
            .setDescription(`الأمر \`${commandName}\` مش موجود.\n\n**الأوامر الموجودة:**\n${availableCommands.map(cmd => `\`${cmd}\``).join(', ')}\n\nاكتب \`يا سمكري\` عشان تشوف كل الأوامر.`)
            .setTimestamp();
        
        return message.reply({ embeds: [suggestionEmbed] }).catch(() => {});
    }

    // Execute command with error handling
    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        
        const { EmbedBuilder } = require('discord.js');
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle('❌ خطأ في الأمر')
            .setDescription('حصل خطأ وأنت بتشغل الأمر. جرب تاني.')
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