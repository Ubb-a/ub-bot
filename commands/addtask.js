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

            // Find where the task content starts (after roadmap name)
            const fullContent = args.join(' ');
            const parts = fullContent.split('|');
            
            if (parts.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ فاصل مفقود')
                    .setDescription('استخدم | للفصل بين عنوان المهمة والوصف\n**مثال:** `!addtask اسم_الخريطة عنوان المهمة | وصف المهمة`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapAndTitle = parts[0].trim().split(' ');
            const roadmapName = roadmapAndTitle[0];
            const taskTitle = roadmapAndTitle.slice(1).join(' ');
            const taskDescription = parts[1].trim();

            if (!roadmapName || !taskTitle || !taskDescription) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ بيانات ناقصة')
                    .setDescription('تأكد من كتابة اسم الخريطة وعنوان المهمة والوصف بشكل صحيح.')
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

            // Create new task with unique emoji
            const taskEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', 
                               '🅰️', '🅱️', '🅾️', '🆎', '🅿️', '🆔', '🆕', '🆗', '🆘', '🆙'];
            
            const newTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;
            const taskEmoji = taskEmojis[Math.min(newTaskId - 1, taskEmojis.length - 1)];
            
            const newTask = {
                id: newTaskId,
                title: taskTitle,
                description: taskDescription,
                emoji: taskEmoji,
                status: 'pending',
                createdAt: new Date().toISOString(),
                createdBy: message.author.id,
                completedBy: [], // Array to track who completed it
                hiddenBy: [] // Array to track who hid it
            };

            // Add task to roadmap
            roadmap.tasks.push(newTask);
            saveRoadmap(roadmapKey, roadmap);

            // Create task embed with reactions
            const taskEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم إضافة المهمة بنجاح!')
                .setDescription(`**خريطة الطريق:** ${roadmap.name}\n**المهمة:** ${taskEmoji} ${taskTitle}\n**الوصف:** ${taskDescription}`)
                .addFields([
                    {
                        name: '📊 تفاصيل المهمة',
                        value: `**الرقم:** ${newTaskId}\n**الإيموجي:** ${taskEmoji}\n**الحالة:** معلقة\n**تم الإنشاء بواسطة:** ${message.author}`,
                        inline: false
                    },
                    {
                        name: '💡 كيفية التفاعل',
                        value: `${taskEmoji} - اضغط لتمييز المهمة كمكتملة\n❌ - اضغط لإخفاء المهمة من قائمتك`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `معرف المهمة: ${newTaskId} | إيموجي: ${taskEmoji}`,
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