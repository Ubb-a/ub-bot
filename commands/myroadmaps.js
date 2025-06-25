const { EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'myroadmaps',
    description: 'List all roadmaps you have access to based on your roles',
    usage: '!myroadmaps',
    
    async execute(message, args) {
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
            .setColor('#5865F2') // Discord blurple
            .setTitle('🗺️ Your Accessible Roadmaps')
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
            embed.setDescription('❌ **No roadmaps available**\n\nYou don\'t have access to any roadmaps in this server. Contact an administrator to get the required roles.')
                .setColor('#ED4245'); // Discord red
        } else {
            let description = `You have access to **${accessibleRoadmaps.length}** roadmap${accessibleRoadmaps.length === 1 ? '' : 's'}:\n\n`;
            
            accessibleRoadmaps.forEach((roadmap, index) => {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const taskCount = roadmap.tasks ? roadmap.tasks.length : 0;
                const completedTasks = roadmap.tasks ? roadmap.tasks.filter(task => task.status === 'completed').length : 0;
                
                description += `**${index + 1}.** \`${roadmap.name}\`\n`;
                description += `   🏷️ **Role:** ${role ? role.toString() : 'Role not found'}\n`;
                description += `   📋 **Tasks:** ${completedTasks}/${taskCount} completed\n`;
                description += `   📅 **Created:** ${new Date(roadmap.createdAt).toLocaleDateString()}\n\n`;
            });
            
            embed.setDescription(description);
        }
        
        // Add helpful commands section
        embed.addFields({
            name: '💡 Available Commands',
            value: '`!showroadmap <name>` - View roadmap details\n`!create <name> role:@role` - Create new roadmap (requires Manage Roles)',
            inline: false
        });
        
        await message.reply({ embeds: [embed] });
    }
};
