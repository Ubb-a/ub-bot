const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'myroadmaps',
    description: 'List all roadmaps you have access to based on your roles',
    usage: '!myroadmaps',
    
    async execute(message, args) {
        try {
        const member = message.member;
        const guildId = message.guild.id;
        
        // Get all roadmaps
        const allRoadmaps = getRoadmaps();
        
        // Filter roadmaps for current guild and check role permissions
        const accessibleRoadmaps = [];
        
        for (const [key, roadmap] of Object.entries(allRoadmaps)) {
            // Only show roadmaps from current guild
            if (roadmap.guildId !== guildId) continue;
            
            // Check if user has required role
            if (member.roles.cache.has(roadmap.roleId)) {
                accessibleRoadmaps.push(roadmap);
            }
        }
        
        // Create embed response
        const embed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('🗺️ الرود ماب الموجودة عندك')
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp()
            .setFooter({
                text: `${message.guild.name} | استخدم !showroadmap <اسم> لعرض التفاصيل`,
                iconURL: message.guild.iconURL({ dynamic: true })
            });

        if (accessibleRoadmaps.length === 0) {
            embed.setDescription('❌ **مفيش رود ماب متاحة**\n\nمش مسموح لك توصل لأي رود ماب في السيرفر ده. كلم الأدمن عشان تاخد الرتبة المطلوبة.')
                .setColor(COLORS.RED);
        } else {
            let description = `عندك صلاحية توصل لـ **${accessibleRoadmaps.length}** رود ماب:\n\n`;
            
            accessibleRoadmaps.forEach((roadmap, index) => {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const taskCount = roadmap.tasks ? roadmap.tasks.length : 0;
                const completedTasks = roadmap.tasks ? roadmap.tasks.filter(task => task.status === 'completed').length : 0;
                
                description += `**${index + 1}.** \`${roadmap.name}\`\n`;
                description += `   🏷️ **الرول:** ${role ? role.toString() : 'الرول غير موجود'}\n`;
                description += `   📋 **المهام:** ${completedTasks}/${taskCount} مكتملة\n`;
                description += `   📅 **تاريخ الإنشاء:** ${new Date(roadmap.createdAt).toLocaleDateString('ar-EG')}\n\n`;
            });
            
            embed.setDescription(description);
        }
        
        // Add helpful commands section
        embed.addFields({
            name: '💡 الأوامر المتاحة',
            value: '`!showroadmap <اسم>` - شوف تفاصيل الرود ماب\n`!create <اسم> role:@رول` - عمل رود ماب جديدة (محتاج صلاحية إدارة الأدوار)',
            inline: false
        });
        
        await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error in myroadmaps command:', err);
        }
    }
};
