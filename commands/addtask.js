const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'addtask',
    description: 'Add a new task to a roadmap',
    usage: 'addtask <roadmap_name> | <task_title> | <task_description> | <week_number>',
    
    async execute(message, args) {
        try {
            // Check if user has manage roles permission
            if (!message.member.permissions.has('ManageRoles')) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('محتاج صلاحية "إدارة الأدوار" عشان تضيف مهام.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ معلومات ناقصة')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`addtask web-dev | تعلم HTML | أساسيات HTML | 1\`\n\n**ملاحظة:** رقم الأسبوع اختياري، لو مكتبتوش هيتحط في الأسبوع الأول.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const fullArgs = args.join(' ');
            const parts = fullArgs.split(' | ');

            if (parts.length < 3 || parts.length > 4) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ استخدام خاطئ')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`addtask web-dev | تعلم HTML | أساسيات HTML | 2\`\n\n**ملاحظة:** رقم الأسبوع اختياري`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const [roadmapName, taskTitle, taskDescription, weekStr] = parts.map(part => part.trim());
            const weekNumber = weekStr ? parseInt(weekStr) : 1;

            // Validate inputs
            if (!roadmapName || !taskTitle || !taskDescription) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ بيانات ناقصة')
                    .setDescription('تأكد من ملء جميع المعلومات المطلوبة.')
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

            // Check if user has required role
            if (!message.member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription(`محتاج رتبة ${role ? role.toString() : 'مطلوبة'} عشان تعدل الرود ماب دي.`)
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
                description: taskDescription,
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
            const taskEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم إضافة المهمة بنجاح!')
                .setDescription(`**الرود ماب:** ${roadmap.name}\n**المهمة:** ${taskTitle}\n**الوصف:** ${taskDescription}\n**الأسبوع:** ${weekNumber}\n**الرقم:** ${newTaskId}`)
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