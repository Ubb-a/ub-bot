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
        const { getRoadmap, saveRoadmap, getRoadmaps } = require('./utils/dataManager');
        const { EmbedBuilder } = require('discord.js');
        const { COLORS } = require('./utils/embedBuilder');
        
        const message = reaction.message;
        const guild = message.guild;
        const member = guild.members.cache.get(user.id);
        
        console.log('🔄 Reaction detected:', reaction.emoji.name, 'from:', user.username);
        console.log('📝 Message ID:', message.id, 'Guild:', guild.name);
        
        const userId = user.id;
        const emojiName = reaction.emoji.name;
        
        // Find roadmap by checking the message context first
        let targetRoadmap = null;
        let roadmapKey = '';
        
        // Try to extract roadmap from embed first (more reliable)
        if (message.embeds && message.embeds.length > 0) {
            const embed = message.embeds[0];
            const embedTitle = embed.title;
            
            if (embedTitle && embedTitle.includes('مهام خريطة:')) {
                const roadmapName = embedTitle.split('مهام خريطة: ')[1];
                roadmapKey = `${guild.id}_${roadmapName.toLowerCase()}`;
                targetRoadmap = getRoadmap(roadmapKey);
                console.log('📋 Found roadmap from embed:', roadmapName);
            }
        }
        
        // If no roadmap found from embed, search all roadmaps
        if (!targetRoadmap) {
            const allRoadmaps = getRoadmaps();
            
            // Search through all roadmaps in this guild
            for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                if (key.startsWith(`${guild.id}_`) && roadmap.tasks) {
                    // Check if any task has this emoji
                    const taskWithEmoji = roadmap.tasks.find(task => task.emoji === emojiName);
                    if (taskWithEmoji) {
                        targetRoadmap = roadmap;
                        roadmapKey = key;
                        console.log('✅ Found roadmap with emoji:', roadmap.name, 'task:', taskWithEmoji.title);
                        break;
                    }
                }
            }
        }
        

        
        if (!targetRoadmap) {
            console.log('❌ No roadmap found for emoji:', emojiName);
            return;
        }
        
        // Check if user has required role
        if (!member.roles.cache.has(targetRoadmap.roleId)) {
            console.log('⛔ User lacks required role');
            return;
        }
        
        let updated = false;
        
        if (emojiName === '❌') {
            // Hide all tasks for this user
            targetRoadmap.tasks.forEach(task => {
                if (!task.hiddenBy) task.hiddenBy = [];
                if (!task.hiddenBy.includes(userId)) {
                    task.hiddenBy.push(userId);
                    updated = true;
                }
            });
            
            if (updated) {
                console.log('👁️ Hidden tasks for user:', userId);
                
                const hideEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('👁️ تم الإخفاء')
                    .setDescription(`تم إخفاء مهام خريطة "${targetRoadmap.name}" من قائمتك الشخصية.`)
                    .setTimestamp();
                
                message.channel.send({ embeds: [hideEmbed] }).catch(console.error);
            }
        } else {
            // Handle task completion - check all tasks with this emoji
            const tasksWithEmoji = targetRoadmap.tasks.filter(task => task.emoji === emojiName);
            console.log('🔍 Searching for tasks with emoji:', emojiName);
            console.log('📋 Found tasks:', tasksWithEmoji.map(t => `${t.emoji} ${t.title}`));
            
            if (tasksWithEmoji.length > 0) {
                // If multiple tasks have same emoji, we need to determine which one from the message context
                let taskToComplete = null;
                
                if (tasksWithEmoji.length === 1) {
                    taskToComplete = tasksWithEmoji[0];
                } else {
                    // Multiple tasks with same emoji - check message embed for context
                    if (message.embeds && message.embeds.length > 0) {
                        const embed = message.embeds[0];
                        const embedFields = embed.fields || [];
                        
                        // Find the field that contains this emoji and matches a task
                        for (const field of embedFields) {
                            if (field.name && field.name.includes(emojiName)) {
                                // Extract task title from field name
                                const fieldTitle = field.name.split(emojiName)[1]?.trim();
                                if (fieldTitle) {
                                    taskToComplete = tasksWithEmoji.find(task => 
                                        field.name.includes(task.title)
                                    );
                                    if (taskToComplete) break;
                                }
                            }
                        }
                    }
                    
                    // If still not found, default to first task with this emoji
                    if (!taskToComplete) {
                        taskToComplete = tasksWithEmoji[0];
                    }
                }
                
                if (taskToComplete) {
                    if (!taskToComplete.completedBy) taskToComplete.completedBy = [];
                    
                    if (!taskToComplete.completedBy.includes(userId)) {
                        taskToComplete.completedBy.push(userId);
                        updated = true;
                        
                        console.log('🎉 Task completed by user:', userId, 'Task:', taskToComplete.title);
                        
                        const completionEmbed = new EmbedBuilder()
                            .setColor(COLORS.GREEN)
                            .setTitle('🎉 تهانينا!')
                            .setDescription(`لقد قمت بتمييز المهمة "${taskToComplete.emoji} ${taskToComplete.title}" كمكتملة!`)
                            .addFields({
                                name: '📊 التقدم',
                                value: `إجمالي من أنجز هذه المهمة: ${taskToComplete.completedBy.length} شخص`,
                                inline: false
                            })
                            .setTimestamp();
                        
                        message.channel.send({ embeds: [completionEmbed] }).catch(console.error);
                    } else {
                        console.log('⚠️ Task already completed by this user');
                    }
                }
            }
        }
        
        if (updated) {
            saveRoadmap(roadmapKey, targetRoadmap);
            console.log('💾 Saved roadmap:', roadmapKey);
        }
        
        // Remove user's reaction
        reaction.users.remove(user.id).catch(console.error);
        
    } catch (err) {
        console.error('❌ Error handling reaction:', err);
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
