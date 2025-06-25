const { EmbedBuilder } = require('discord.js');
const { createErrorEmbed } = require('../utils/embedBuilder');
const { getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'showroadmap',
    description: 'Display detailed information about a specific roadmap',
    usage: '!showroadmap <roadmap_name>',
    
    async execute(message, args) {
        // Check if roadmap name is provided
        if (args.length === 0) {
            const errorEmbed = createErrorEmbed(
                'Missing Roadmap Name',
                `**Usage:** ${this.usage}\n**Example:** \`!showroadmap frontend-development\``
            );
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
            const errorEmbed = createErrorEmbed(
                'Roadmap Not Found',
                `No roadmap named "**${roadmapName}**" exists in this server.\n\nUse \`!myroadmaps\` to see available roadmaps.`
            );
            return message.reply({ embeds: [errorEmbed] });
        }
        
        // Check if user has required role
        if (!member.roles.cache.has(roadmap.roleId)) {
            const role = message.guild.roles.cache.get(roadmap.roleId);
            const errorEmbed = createErrorEmbed(
                'Access Denied',
                `You don't have permission to view this roadmap.\n\n**Required Role:** ${role ? role.toString() : 'Role not found'}`
            );
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
            .setColor('#5865F2') // Discord blurple
            .setTitle(`🗺️ ${roadmap.name}`)
            .setDescription(`**Progress:** ${progressPercentage}% (${completedTasks}/${totalTasks} tasks completed)`)
            .addFields(
                {
                    name: '🏷️ Required Role',
                    value: role ? role.toString() : 'Role not found',
                    inline: true
                },
                {
                    name: '👤 Created By',
                    value: creator ? creator.tag : 'Unknown User',
                    inline: true
                },
                {
                    name: '📅 Created On',
                    value: new Date(roadmap.createdAt).toLocaleDateString(),
                    inline: true
                },
                {
                    name: '📊 Task Statistics',
                    value: `✅ Completed: ${completedTasks}\n🔄 In Progress: ${inProgressTasks}\n⏳ Pending: ${pendingTasks}`,
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({
                text: `${message.guild.name} | Roadmap ID: ${roadmap.id}`,
                iconURL: message.guild.iconURL({ dynamic: true })
            });
        
        // Add progress bar
        const progressBarLength = 20;
        const filledLength = Math.round((progressPercentage / 100) * progressBarLength);
        const emptyLength = progressBarLength - filledLength;
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
        
        embed.addFields({
            name: '📈 Progress Bar',
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
                tasksText += `*... and ${tasks.length - maxTasksToShow} more tasks*`;
            }
            
            embed.addFields({
                name: `📋 Tasks (${Math.min(tasks.length, maxTasksToShow)}/${tasks.length})`,
                value: tasksText || 'No tasks available.',
                inline: false
            });
        } else {
            embed.addFields({
                name: '📋 Tasks',
                value: 'No tasks have been added to this roadmap yet.',
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};
