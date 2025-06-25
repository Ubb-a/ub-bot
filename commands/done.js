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
                    .setTitle('❌ Task Number Missing')
                    .setDescription(`**Usage:** ${this.usage}\n**Example:** \`!done 2\` or \`!done 2 backend\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const taskNumber = parseInt(args[0]);
            if (isNaN(taskNumber) || taskNumber < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid Number')
                    .setDescription('Please enter a valid task number (1, 2, 3...)')
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
                        .setTitle('❌ Roadmap Not Found')
                        .setDescription(`No roadmap named "${roadmapName}" exists in this server.`)
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
                        .setTitle('❌ No Available Roadmaps')
                        .setDescription('You don\'t have permission to access any roadmap in this server.')
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }

                if (userRoadmaps.length === 1) {
                    targetRoadmap = userRoadmaps[0].roadmap;
                    roadmapKey = userRoadmaps[0].key;
                } else {
                    // Multiple roadmaps available, ask user to specify
                    const roadmapNames = userRoadmaps.map(rm => rm.roadmap.name).join(', ');
                    const errorEmbed = new EmbedBuilder()
                        .setColor(COLORS.YELLOW)
                        .setTitle('🤔 Multiple Roadmaps Available')
                        .setDescription(`You have access to multiple roadmaps: ${roadmapNames}\n\nPlease specify the roadmap name:\n\`!done ${taskNumber} roadmap_name\``)
                        .setTimestamp();
                    return message.reply({ embeds: [errorEmbed] });
                }
            }

            // Check if user has required role
            if (!member.roles.cache.has(targetRoadmap.roleId)) {
                const role = message.guild.roles.cache.get(targetRoadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to interact with tasks in this roadmap.`)
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
                    .setTitle('📋 No Tasks')
                    .setDescription(`No visible tasks in "${targetRoadmap.name}" roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            if (taskNumber > visibleTasks.length) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Task Number Not Found')
                    .setDescription(`Task number ${taskNumber} doesn't exist. Available tasks: ${visibleTasks.length}`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get the task by its position in visible tasks (1-indexed)
            const taskToComplete = visibleTasks[taskNumber - 1];

            if (!taskToComplete.completedBy) taskToComplete.completedBy = [];

            if (taskToComplete.completedBy.includes(userId)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('⚠️ Task Already Completed')
                    .setDescription(`You have already marked the task "${taskToComplete.title}" as completed.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Mark task as completed
            taskToComplete.completedBy.push(userId);
            saveRoadmap(roadmapKey, targetRoadmap);

            const completionEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('🎉 Congratulations!')
                .setDescription(`You have marked the task "${taskToComplete.title}" as completed!`)
                .addFields([
                    {
                        name: '📊 Task Details',
                        value: `**Roadmap:** ${targetRoadmap.name}\n**Task:** ${taskToComplete.title}`,
                        inline: false
                    },
                    {
                        name: '📈 Progress',
                        value: `Total people who completed this task: ${taskToComplete.completedBy.length}`,
                        inline: false
                    }
                ])
                .setTimestamp()
                .setFooter({
                    text: `${targetRoadmap.name} | Task Completion`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            await message.reply({ embeds: [completionEmbed] });

        } catch (err) {
            console.error('Error in done command:', err);
        }
    }
};