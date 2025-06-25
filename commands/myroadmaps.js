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
            .setTitle('🗺️ Your Available Roadmaps')
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp()
            .setFooter({
                text: `${message.guild.name} | Use !showroadmap <name> to view details`,
                iconURL: message.guild.iconURL({ dynamic: true })
            });

        if (accessibleRoadmaps.length === 0) {
            embed.setDescription('❌ **No Available Roadmaps**\n\nYou don\'t have access to any roadmaps in this server. Contact an admin to get the required role.')
                .setColor(COLORS.RED);
        } else {
            let description = `You have access to **${accessibleRoadmaps.length}** roadmaps:\n\n`;
            
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
