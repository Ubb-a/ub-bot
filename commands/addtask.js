const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'addtask',
    description: 'Add a new task to a roadmap',
    usage: '!addtask <roadmap_name> <task_title> | <task_description>',
    
    async execute(message, args) {
        try {
            // Check if user has manage roles permission
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('تحتاج صلاحية "إدارة الأدوار" لإضافة المهام.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse arguments
            if (args.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ استخدام خاطئ')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!addtask تطوير-المواقع تعلم HTML | تعلم أساسيات HTML وCSS\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse roadmap name and task title
            const inputParts = args.join(' ').split(' ');
            if (inputParts.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ تنسيق خاطئ')
                    .setDescription('**الاستخدام:** `!addtask اسم_الخريطة عنوان_المهمة`\n**مثال:** `!addtask back_end تعلم JavaScript`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = inputParts[0];
            const taskTitle = inputParts.slice(1).join(' ');

            if (!roadmapName || !taskTitle) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ بيانات ناقصة')
                    .setDescription('تأكد من كتابة اسم الخريطة وعنوان المهمة.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الخريطة غير موجودة')
                    .setDescription(`خريطة الطريق "${roadmapName}" غير موجودة في هذا السيرفر.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!message.member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription(`تحتاج رول ${role ? role.toString() : 'غير موجود'} للتعديل على هذه الخريطة.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create new task with unique emoji - ensure each task has different emoji
            const taskEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', 
                               '📝', '📚', '💻', '🔧', '⚡', '🎯', '🚀', '💡', '🔥', '⭐', 
                               '🎨', '📊', '🛠️', '🔍', '📱', '🌟', '💰', '🎵', '🏆', '🎮',
                               '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔸'];
            
            // Find first unused emoji in this roadmap
            let taskEmoji = '📝';
            const usedEmojis = roadmap.tasks.map(task => task.emoji);
            for (const emoji of taskEmojis) {
                if (!usedEmojis.includes(emoji)) {
                    taskEmoji = emoji;
                    break;
                }
            }
            
            const newTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;
            
            const newTask = {
                id: newTaskId,
                title: taskTitle,
                emoji: taskEmoji,
                status: 'pending',
                createdBy: message.author.id,
                completedBy: [], // Array to track who completed it
                hiddenBy: [] // Array to track who hid it
            };

            // Add task to roadmap
            roadmap.tasks.push(newTask);
            saveRoadmap(roadmapKey, roadmap);

            // Create task embed
            const taskEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم إضافة المهمة بنجاح!')
                .setDescription(`**خريطة الطريق:** ${roadmap.name}\n**المهمة:** ${taskTitle}`)
                .addFields([
                    {
                        name: '💡 كيفية الاستخدام',
                        value: `استخدم \`!tasks ${roadmap.name.toLowerCase()}\` لعرض المهام\nاستخدم \`!done رقم_المهمة\` لإنهاء المهام`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `إجمالي المهام: ${roadmap.tasks.length}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            const replyMessage = await message.reply({ embeds: [taskEmbed] });
            
            // Add reaction buttons - task emoji for completion, ❌ for hiding
            await replyMessage.react(taskEmoji);
            await replyMessage.react('❌');

            // Store message ID for reaction handling
            newTask.messageId = replyMessage.id;
            newTask.channelId = message.channel.id;
            saveRoadmap(roadmapKey, roadmap);

        } catch (err) {
            console.error('Error in addtask command:', err);
        }
    }
};