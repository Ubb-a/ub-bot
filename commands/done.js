const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'done',
    description: 'Mark a task as completed by its number',
    usage: '!done <task_number> [roadmap_name]',
    
    async execute(message, args) {
        try {
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم المهمة مفقود')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!done 2\` أو \`!done 2 back_end\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const taskNumber = parseInt(args[0]);
            if (isNaN(taskNumber) || taskNumber < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم غير صحيح')
                    .setDescription('يرجى إدخال رقم صحيح للمهمة (1، 2، 3...)')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const member = message.member;
            const guildId = message.guild.id;
            const userId = message.author.id;

            let targetRoadmap = null;
            let roadmapKey = '';

            // If roadmap name is provided, use it
            if (args.length > 1) {
                const roadmapName = args.slice(1).join(' ');
                roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
                targetRoadmap = getRoadmap(roadmapKey);

                if (!targetRoadmap) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ الخريطة غير موجودة')
                        .setDescription(`لا توجد خريطة طريق بالاسم "${roadmapName}" في هذا السيرفر.`)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            } else {
                // Find roadmap from user's accessible roadmaps
                const allRoadmaps = getRoadmaps();
                const userRoadmaps = [];

                for (const [key, roadmap] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`) && member.roles.cache.has(roadmap.roleId)) {
                        userRoadmaps.push({ key, roadmap });
                    }
                }

                if (userRoadmaps.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ لا توجد خرائط متاحة')
                        .setDescription('ليس لديك الصلاحية للوصول إلى أي خريطة طريق في هذا السيرفر.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    targetRoadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Multiple roadmaps available, ask user to specify
                    const roadmapNames = userRoadmaps.map(rm => rm.roadmap.name).join('، ');
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🤔 أكثر من خريطة متاحة')
                        .setDescription(`لديك الوصول إلى عدة خرائط: ${roadmapNames}\n\nيرجى تحديد اسم الخريطة:\n\`!done ${taskNumber} اسم_الخريطة\``)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Check if user has required role
            if (!member.roles.cache.has(targetRoadmap.roleId)) {
                const role = message.guild.roles.cache.get(targetRoadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription(`تحتاج رول ${role ? role.toString() : 'غير موجود'} للتفاعل مع مهام هذه الخريطة.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = targetRoadmap.tasks || [];
            
            // Filter visible tasks for this user
            const visibleTasks = tasks.filter(task => 
                !task.hiddenBy || !task.hiddenBy.includes(userId)
            );

            if (visibleTasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 لا توجد مهام')
                    .setDescription(`لا توجد مهام مرئية في خريطة "${targetRoadmap.name}".`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (taskNumber > visibleTasks.length) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم المهمة غير موجود')
                    .setDescription(`رقم المهمة ${taskNumber} غير موجود. إجمالي المهام المتاحة: ${visibleTasks.length}`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get the task by its position in visible tasks (1-indexed)
            const taskToComplete = visibleTasks[taskNumber - 1];

            if (!taskToComplete.completedBy) taskToComplete.completedBy = [];

            if (taskToComplete.completedBy.includes(userId)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('⚠️ مهمة مكتملة بالفعل')
                    .setDescription(`لقد قمت بالفعل بتمييز المهمة "${taskToComplete.title}" كمكتملة.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Mark task as completed
            taskToComplete.completedBy.push(userId);
            saveRoadmap(roadmapKey, targetRoadmap);

            const completionEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('🎉 تهانينا!')
                .setDescription(`لقد قمت بتمييز المهمة "${taskToComplete.title}" كمكتملة!`)
                .addFields([
                    {
                        name: '📊 تفاصيل المهمة',
                        value: `**الخريطة:** ${targetRoadmap.name}\n**المهمة:** ${taskToComplete.title}\n**الوصف:** ${taskToComplete.description}`,
                        inline: false
                    },
                    {
                        name: '📈 التقدم',
                        value: `إجمالي من أنجز هذه المهمة: ${taskToComplete.completedBy.length} شخص`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `معرف المهمة: ${taskToComplete.id}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            await message.reply({ embeds: [completionEmbed] });

        } catch (err) {
            console.error('Error in done command:', err);
        }
    }
};