const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'showroadmap',
    description: 'Display detailed information about a specific roadmap',
    usage: '!showroadmap <roadmap_name>',
    
    async execute(message, args) {
        // Check if roadmap name is provided
        if (args.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ اسم الخريطة مفقود')
                .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!showroadmap تطوير-المواقع\``)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        const roadmapName = args.join(' ');
        const member = message.member;
        const guildId = message.guild.id;
        
        // Get all roadmaps and find the requested one
        const allRoadmaps = getRoadmaps();
        const roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
        const roadmap = allRoadmaps[roadmapKey];
        
        // Check if roadmap exists
        if (!roadmap) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ الخريطة غير موجودة')
                .setDescription(`لا توجد خريطة طريق بالاسم "**${roadmapName}**" في هذا السيرفر.\n\nاستخدم \`!myroadmaps\` لرؤية الخرائط المتاحة.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Check if user has required role
        if (!member.roles.cache.has(roadmap.roleId)) {
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ ممنوع الوصول')
                .setDescription(`ليس لديك صلاحية لعرض هذه الخريطة.\n\n**الرول المطلوب:** ${role ? role.toString() : 'الرول غير موجود'}`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Get role information
        const role = message.guild.roles.cache.get(roadmap.roleId);
        const creator = await message.client.users.fetch(roadmap.createdBy).catch(() => null);
        
        // Calculate task statistics
        const tasks = roadmap.tasks || [];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending').length;
        const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Create main embed
        const embed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle(`🗺️ ${roadmap.name}`)
            .setDescription(`**التقدم:** ${progressPercentage}% (${completedTasks}/${totalTasks} مهمة مكتملة)`)
            .addFields(
                {
                    name: '🏷️ الرول المطلوب',
                    value: role ? role.toString() : 'الرول غير موجود',
                    inline: true
                },
                {
                    name: '👤 تم الإنشاء بواسطة',
                    value: creator ? creator.tag : 'مستخدم غير معروف',
                    inline: true
                },
                {
                    name: '📅 تاريخ الإنشاء',
                    value: new Date(roadmap.createdAt).toLocaleDateString('ar-EG'),
                    inline: true
                },
                {
                    name: '📊 إحصائيات المهام',
                    value: `✅ مكتملة: ${completedTasks}\n🔄 قيد التنفيذ: ${inProgressTasks}\n⏳ معلقة: ${pendingTasks}`,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: `${message.guild.name} | معرف الخريطة: ${roadmap.id}`,
                iconURL: message.guild.iconURL({ dynamic: true })
            });
        
        // Add progress bar
        const progressBarLength = 20;
        const filledLength = Math.round((progressPercentage / 100) * progressBarLength);
        const emptyLength = progressBarLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        
        embed.addFields({
            name: '📈 شريط التقدم',
            value: `\`${progressBar}\` ${progressPercentage}%`,
            inline: false
        });
        
        // Add tasks section
        if (tasks.length > 0) {
            let tasksText = '';
            const maxTasksToShow = 10; // Limit to prevent embed overflow
            
            tasks.slice(0, maxTasksToShow).forEach((task, index) => {
                let statusEmoji = '';
                switch (task.status) {
                    case 'completed':
                        statusEmoji = '✅';
                        break;
                    case 'in-progress':
                        statusEmoji = '🔄';
                        break;
                    default:
                        statusEmoji = '⏳';
                }
                
                tasksText += `${statusEmoji} **${task.title}**\n`;
                if (task.description) {
                    tasksText += `   ${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}\n`;
                }
                tasksText += '\n';
            });
            
            if (tasks.length > maxTasksToShow) {
                tasksText += `*... و ${tasks.length - maxTasksToShow} مهام أخرى*`;
            }
            
            embed.addFields({
                name: `📋 المهام (${Math.min(tasks.length, maxTasksToShow)}/${tasks.length})`,
                value: tasksText || 'لا توجد مهام متاحة.',
                inline: false
            });
        } else {
            embed.addFields({
                name: '📋 المهام',
                value: 'لم يتم إضافة أي مهام لهذه الخريطة بعد.',
                inline: false
            });
        }
        
        return message.reply({ embeds: [embed] }).catch(err => {
            console.error('Error sending showroadmap response:', err);
        });
    }
};
