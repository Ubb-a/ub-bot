const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'tasks',
    description: 'Show all tasks in a roadmap with interactive buttons',
    usage: 'tasks [roadmap_name]',
    
    async execute(message, args) {
        try {
            const member = message.member;
            const guildId = message.guild.id;
            const { getRoadmaps } = require('../utils/dataManager');
            
            let roadmap = null;
            let roadmapKey = '';

            if (args.length === 0) {
                // No roadmap name provided, find user's accessible roadmap
                const allRoadmaps = getRoadmaps();
                const userRoadmaps = [];

                for (const [key, rm] of Object.entries(allRoadmaps)) {
                    if (key.startsWith(`${guildId}_`) && member.roles.cache.has(rm.roleId)) {
                        userRoadmaps.push({ key, roadmap: rm });
                    }
                }

                if (userRoadmaps.length === 0) {
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.RED)
                        .setTitle('❌ No Access')
                        .setDescription('You don\'t have access to any roadmaps in this server.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    roadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Multiple roadmaps available
                    const roadmapNames = userRoadmaps.map(rm => rm.roadmap.name).join(', ');
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🤔 Multiple Roadmaps Available')
                        .setDescription(`You have access to multiple roadmaps: ${roadmapNames}\n\nPlease specify which one:\n\`tasks roadmap_name\``)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            } else {
                // Roadmap name provided
                const roadmapName = args.join(' ');
                roadmapKey = `${guildId}_${roadmapName.toLowerCase()}`;
                roadmap = getRoadmap(roadmapKey);
            }

            if (!roadmap) {
                const roadmapName = args.join(' ');
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to view tasks in this roadmap.`)
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
                    .setTitle('📋 No Tasks')
                    .setDescription(`No visible tasks in "${roadmap.name}" roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create tasks embed
            const embed = new EmbedBuilder()
                .setColor(COLORS.BLURPLE)
                .setTitle(`📋 Tasks: ${roadmap.name}`)
                .setDescription(`Total visible tasks: ${visibleTasks.length}`)
                .setTimestamp()
                .setFooter({
                    text: `${message.guild.name} | Use done task_number`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Add each task as a field with numbers
            for (let i = 0; i < Math.min(visibleTasks.length, 15); i++) {
                const task = visibleTasks[i];
                const isCompleted = task.completedBy && task.completedBy.includes(userId);
                const statusEmoji = isCompleted ? '✅' : '⏳';
                const taskNumber = i + 1;
                
                embed.addFields({
                    name: `${statusEmoji} ${taskNumber}. ${task.title}`,
                    value: `**Task Number:** ${taskNumber}`,
                    inline: false
                });
            }

            if (visibleTasks.length > 15) {
                embed.addFields({
                    name: '📌 Note',
                    value: `Showing first 15 tasks only. Total tasks: ${visibleTasks.length}`,
                    inline: false
                });
            }

            // Add instructions for completing tasks
            embed.addFields({
                name: '💡 How to Use',
                value: `To mark a task as completed, type: \`done task_number\`\nExample: \`done 2\` to complete task number 2`,
                inline: false
            });

            await message.reply({ embeds: [embed] });

            // Store interaction data in message (for reaction handler)
            // We'll handle this in the bot.js reaction handler

        } catch (err) {
            console.error('Error in tasks command:', err);
        }
    }
};