const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'addtask',
    description: 'Add a new task to a roadmap',
    usage: 'addtask <roadmap_name> <week_number> <task_title> [link: <url>]',
    
    async execute(message, args) {
        try {
            // Check if user is mentioned or has manage roles permission
            const mentionedUsers = message.mentions.users;
            const hasManageRoles = message.member.permissions.has('ManageRoles');
            
            if (!hasManageRoles && !mentionedUsers.has(message.author.id)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('محتاج صلاحية "إدارة الأدوار" أو منشن عشان تضيف مهام.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ معلومات ناقصة')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`addtask web-dev 2 تعلم HTML\` أو \`addtask web-dev 2 تعلم HTML link: https://example.com\`\n\n**ملاحظة:** رقم الأسبوع من 1 لـ 52.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const fullArgs = args.join(' ');
            
            if (args.length < 3) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ استخدام خاطئ')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`addtask web-dev 2 تعلم HTML\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse roadmap name, week number, and task title
            const roadmapName = args[0];
            const weekNumber = parseInt(args[1]);
            
            // Check for link in the text
            let taskTitle = args.slice(2).join(' ');
            let taskLink = null;
            
            if (taskTitle.includes('link:')) {
                const linkIndex = taskTitle.indexOf('link:');
                const beforeLink = taskTitle.substring(0, linkIndex).trim();
                const afterLink = taskTitle.substring(linkIndex + 5).trim();
                
                taskTitle = beforeLink;
                taskLink = afterLink;
            }

            // Validate inputs
            if (!roadmapName || !taskTitle) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ بيانات ناقصة')
                    .setDescription('تأكد من كتابة اسم الرود ماب ورقم الأسبوع واسم المهمة.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Validate week number
            if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم أسبوع غير صحيح')
                    .setDescription('رقم الأسبوع لازم يكون رقم من 1 لـ 52.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الرود ماب مش موجودة')
                    .setDescription(`مفيش رود ماب بالاسم "${roadmapName}" في السيرفر ده.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Skip role check since we're using mentions now

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
                description: taskTitle, // Use title as description
                link: taskLink, // Add link if provided
                emoji: taskEmoji,
                status: 'pending',
                createdBy: message.author.id,
                weekNumber: weekNumber,
                createdAt: new Date().toISOString(),
                completedBy: [], // Array to track who completed it
                hiddenBy: [] // Array to track who hid it
            };

            // Add task to roadmap
            roadmap.tasks.push(newTask);
            saveRoadmap(roadmapKey, roadmap);

            // Create task embed
            let embedDescription = `**الرود ماب:** ${roadmap.name}\n**المهمة:** ${taskTitle}\n**الأسبوع:** ${weekNumber}\n**الرقم:** ${newTaskId}`;
            
            if (taskLink) {
                embedDescription += `\n**الرابط:** ${taskLink}`;
            }
            
            const taskEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم إضافة المهمة بنجاح!')
                .setDescription(embedDescription)
                .addFields([
                    {
                        name: '💡 طريقة الاستعمال',
                        value: `استعمل \`tasks ${roadmap.name.toLowerCase()}\` عشان تشوف المهام\nاستعمل \`done رقم_المهمة\` عشان تخلص المهمة`,
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