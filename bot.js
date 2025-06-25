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

// Reaction handler for task interactions
client.on('messageReactionAdd', async (reaction, user) => {
    // Ignore bot reactions
    if (user.bot) return;
    
    try {
        const { getRoadmap, saveRoadmap } = require('./utils/dataManager');
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const message = reaction.message;
        const guild = message.guild;
        const member = guild.members.cache.get(user.id);
        
        // Check if this is a task-related message
        if (!message.embeds || message.embeds.length === 0) return;
        
        // Skip if message is from bot itself
        if (message.author.bot) return;
        
        const embed = message.embeds[0];
        const embedTitle = embed.title;
        
        // Handle task completion/hiding - improved detection
        if (embedTitle && (embedTitle.includes('مهام خريطة') || embedTitle.includes('تم إضافة المهمة') || embed.description)) {
            console.log('Processing reaction:', reaction.emoji.name, 'from user:', user.username);
            
            // Find roadmap name from various sources
            let roadmapName = '';
            let roadmapKey = '';
            
            // Try to extract roadmap name from title
            if (embedTitle && embedTitle.includes('مهام خريطة:')) {
                roadmapName = embedTitle.split('مهام خريطة: ')[1];
            } else if (embed.description && embed.description.includes('خريطة الطريق:')) {
                const lines = embed.description.split('\n');
                const roadmapLine = lines.find(line => line.includes('خريطة الطريق:'));
                if (roadmapLine) {
                    roadmapName = roadmapLine.split('خريطة الطريق: ')[1].split('\n')[0];
                }
            }
            
            // If still no roadmap name, try to find from all roadmaps
            if (!roadmapName) {
                const { getRoadmaps } = require('./utils/dataManager');
                const allRoadmaps = getRoadmaps();
                
                // Look for roadmap by checking if any task has this emoji
                for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guild.id}_`) && roadmap.tasks) {
                        const taskWithEmoji = roadmap.tasks.find(task => task.emoji === reaction.emoji.name);
                        if (taskWithEmoji) {
                            roadmapKey = key;
                            roadmapName = roadmap.name;
                            break;
                        }
                    }
                }
            } else {
                roadmapKey = `${guild.id}_${roadmapName.toLowerCase()}`;
            }
            
            if (!roadmapName || !roadmapKey) {
                console.log('Could not find roadmap for reaction:', reaction.emoji.name);
                return;
            }
            
            const roadmap = getRoadmap(roadmapKey);
            if (!roadmap) {
                console.log('Roadmap not found:', roadmapKey);
                return;
            }
            
            // Check if user has required role
            if (!member.roles.cache.has(roadmap.roleId)) {
                console.log('User does not have required role');
                return;
            }
            
            const userId = user.id;
            let updated = false;
            
            console.log('Looking for task with emoji:', reaction.emoji.name);
            console.log('Available tasks:', roadmap.tasks.map(t => ({ id: t.id, emoji: t.emoji, title: t.title })));
            
            // Handle task-specific emoji reactions (completion)
            const taskWithEmoji = roadmap.tasks.find(task => task.emoji === reaction.emoji.name);
            if (taskWithEmoji) {
                console.log('Found task with emoji:', taskWithEmoji.title);
                
                // Mark specific task as completed for this user
                if (!taskWithEmoji.completedBy) taskWithEmoji.completedBy = [];
                if (!taskWithEmoji.completedBy.includes(userId)) {
                    taskWithEmoji.completedBy.push(userId);
                    updated = true;
                    
                    console.log('Marked task as completed by user:', userId);
                    
                    // Send completion message for specific task
                    const completionEmbed = new EmbedBuilder()
                        .setColor(COLORS.GREEN)
                        .setTitle('🎉 تهانينا!')
                        .setDescription(`لقد قمت بتمييز المهمة "${taskWithEmoji.emoji} ${taskWithEmoji.title}" كمكتملة!`)
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [completionEmbed] }).catch(console.error);
                } else {
                    console.log('Task already completed by this user');
                }
                
            } else if (reaction.emoji.name === '❌') {
                console.log('Processing hide reaction');
                
                // Hide all tasks for this user
                roadmap.tasks.forEach(task => {
                    if (!task.hiddenBy) task.hiddenBy = [];
                    if (!task.hiddenBy.includes(userId)) {
                        task.hiddenBy.push(userId);
                        updated = true;
                    }
                });
                
                if (updated) {
                    console.log('Hidden tasks for user:', userId);
                    
                    // Send hide message
                    const hideEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('👁️ تم الإخفاء')
                        .setDescription(`تم إخفاء مهام خريطة "${roadmapName}" من قائمتك الشخصية.`)
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [hideEmbed] }).catch(console.error);
                }
            } else {
                console.log('No matching emoji found for:', reaction.emoji.name);
            }
            
            if (updated) {
                saveRoadmap(roadmapKey, roadmap);
                console.log('Saved roadmap with updates');
            }
            
            // Remove user's reaction
            reaction.users.remove(user.id).catch(console.error);
        }
        
    } catch (err) {
        console.error('Error handling reaction:', err);
    }
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
                { name: '!tasks', value: 'عرض المهام مع التفاعل', inline: true },
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
        return await command.execute(message, args, client);
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
