const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'showroadmap',
    description: 'Display detailed information about a specific roadmap',
    usage: '!showroadmap <roadmap_name>',
    
    async execute(message, args) {
        try {
        // Check if roadmap name is provided
        if (args.length === 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ اسم الرود ماب مفقود')
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
                .setTitle('❌ الرود ماب مش موجودة')
                .setDescription(`مفيش رود ماب بالاسم "**${roadmapName}**" في السيرفر ده.\n\nاستعمل \`!myroadmaps\` عشان تشوف الرود ماب الموجودة.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Check if user has required role
        if (!member.roles.cache.has(roadmap.roleId)) {
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ ممنوع الوصول')
                .setDescription(`مش مسموح ليك تشوف الرود ماب دي.\n\n**الرتبة المطلوبة:** ${role ? role.toString() : 'الرتبة مش موجودة'}`)
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
                text: `${message.guild.name} | معرف الرود ماب: ${roadmap.id}`,
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
        
        // Group tasks by week
        const tasksByWeek = {};
        tasks.forEach(task => {
            const week = task.weekNumber || 1;
            if (!tasksByWeek[week]) {
                tasksByWeek[week] = [];
            }
            tasksByWeek[week].push(task);
        });

        // Add tasks section organized by weeks
        if (tasks.length > 0) {
            const sortedWeeks = Object.keys(tasksByWeek).sort((a, b) => parseInt(a) - parseInt(b));
            
            for (const weekNum of sortedWeeks.slice(0, 5)) { // Show max 5 weeks to prevent overflow
                const weekTasks = tasksByWeek[weekNum];
                let weekText = '';
                
                weekTasks.forEach((task, index) => {
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
                    
                    weekText += `${statusEmoji} **${task.id}.** ${task.title}\n`;
                    if (task.description) {
                        weekText += `   ${task.description.substring(0, 60)}${task.description.length > 60 ? '...' : ''}\n`;
                    }
                    weekText += '\n';
                });
                
                embed.addFields({
                    name: `📅 الأسبوع ${weekNum} (${weekTasks.length} مهمة)`,
                    value: weekText || 'مفيش مهام في الأسبوع ده.',
                    inline: false
                });
            }
            
            if (sortedWeeks.length > 5) {
                embed.addFields({
                    name: '📝 ملاحظة',
                    value: `... و ${sortedWeeks.length - 5} أسابيع أخرى. استعمل \`tasks ${roadmap.name}\` لشوف كل المهام.`,
                    inline: false
                });
            }
        } else {
            embed.addFields({
                name: '📋 المهام',
                value: 'مفيش مهام متضافة للرود ماب دي لسه.',
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error in showroadmap command:', err);
        }
    }
};
