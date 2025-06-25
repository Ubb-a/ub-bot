const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'tasks',
    description: 'Show all tasks in a roadmap with interactive buttons',
    usage: '!tasks <roadmap_name>',
    
    async execute(message, args) {
        try {
            // Check if roadmap name is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ اسم الخريطة مفقود')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!tasks تطوير-المواقع\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args.join(' ');
            const member = message.member;
            const guildId = message.guild.id;

            // Get roadmap
            const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الخريطة غير موجودة')
                    .setDescription(`لا توجد خريطة طريق بالاسم "${roadmapName}" في هذا السيرفر.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription(`تحتاج رول ${role ? role.toString() : 'غير موجود'} لعرض مهام هذه الخريطة.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const tasks = roadmap.tasks || [];
            const userId = message.author.id;

            // Filter tasks that user hasn't hidden
            const visibleTasks = tasks.filter(task => 
                !task.hiddenBy || !task.hiddenBy.includes(userId)
            );

            if (visibleTasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('📋 لا توجد مهام')
                    .setDescription(`لا توجد مهام مرئية في خريطة "${roadmap.name}".`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create tasks embed
            const embed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`📋 مهام خريطة: ${roadmap.name}`)
                .setDescription(`إجمالي المهام المرئية: ${visibleTasks.length}`)
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | اضغط على الإيموجي للتفاعل`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Add each task as a field with reactions
            for (let i = 0; i < Math.min(visibleTasks.length, 10); i++) {
                const task = visibleTasks[i];
                const isCompleted = task.completedBy && task.completedBy.includes(userId);
                const statusEmoji = isCompleted ? '✅' : '⏳';
                
                embed.addFields({
                    name: `${statusEmoji} ${task.title}`,
                    value: `**الوصف:** ${task.description}\n**الرقم:** ${task.id}\n**تاريخ الإنشاء:** ${new Date(task.createdAt).toLocaleDateString('ar-EG')}\n\n✅ - مكتملة | ❌ - إخفاء`,
                    inline: false
                });
            }

            if (visibleTasks.length > 10) {
                embed.addFields({
                    name: '📌 ملاحظة',
                    value: `يتم عرض أول 10 مهام فقط. إجمالي المهام: ${visibleTasks.length}`,
                    inline: false
                });
            }

            const replyMessage = await message.reply({ embeds: [embed] });
            
            // Add reactions for each visible task (up to 10)
            const taskIds = visibleTasks.slice(0, 10).map(t => t.id);
            
            // Store task interaction data
            const interactionData = {
                roadmapKey,
                taskIds,
                userId: message.author.id,
                messageId: replyMessage.id
            };

            // Add reactions
            await replyMessage.react('✅');
            await replyMessage.react('❌');

            // Store interaction data in message (for reaction handler)
            // We'll handle this in the bot.js reaction handler

        } catch (err) {
            console.error('Error in tasks command:', err);
        }
    }
};