const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'bulkaddtask',
    description: 'Add multiple tasks to a roadmap at once',
    usage: 'bulkaddtask <roadmap_name> , <task1> , <task2> , <task3>',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to add tasks.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Arguments')
                    .setDescription('**Usage:** `bulkaddtask roadmap_name | task1 | task2 | task3`\n**Example:** `bulkaddtask backend | Learn Node.js | Setup Database | Create API`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse input using | as separator
            const fullInput = args.join(' ');
            const parts = fullInput.split(',').map(part => part.trim());

            if (parts.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Wrong Format')
                    .setDescription('Use , to separate roadmap name and tasks\n**Usage:** `bulkaddtask roadmap_name , task1 , task2 , task3`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = parts[0];
            const taskTitles = parts.slice(1).filter(task => task.length > 0);

            if (taskTitles.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ No Tasks Provided')
                    .setDescription('Please provide at least one task title.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Roadmap Not Found')
                    .setDescription(`Roadmap "${roadmapName}" doesn't exist in this server.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if user has required role
            if (!message.member.roles.cache.has(roadmap.roleId)) {
                const role = message.guild.roles.cache.get(roadmap.roleId);
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Access Denied')
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to edit this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Prepare emoji pool
            const taskEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', 
                               '📝', '📚', '💻', '🔧', '⚡', '🎯', '🚀', '💡', '🔥', '⭐', 
                               '🎨', '📊', '🛠️', '🔍', '📱', '🌟', '💰', '🎵', '🏆', '🎮',
                               '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔸'];

            // Get used emojis
            const usedEmojis = roadmap.tasks.map(task => task.emoji);
            let availableEmojis = taskEmojis.filter(emoji => !usedEmojis.includes(emoji));

            // Check if we have enough emojis
            if (availableEmojis.length < taskTitles.length) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.YELLOW)
                    .setTitle('⚠️ Too Many Tasks')
                    .setDescription(`You can only add ${availableEmojis.length} more tasks to this roadmap (emoji limit reached).`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Create tasks
            const newTasks = [];
            let currentTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;

            for (let i = 0; i < taskTitles.length; i++) {
                const taskTitle = taskTitles[i];
                const taskEmoji = availableEmojis[i];

                const newTask = {
                    id: currentTaskId,
                    title: taskTitle,
                    emoji: taskEmoji,
                    status: 'pending',
                    createdBy: message.author.id,
                    completedBy: [],
                    hiddenBy: []
                };

                newTasks.push(newTask);
                roadmap.tasks.push(newTask);
                currentTaskId++;
            }

            // Save roadmap
            saveRoadmap(roadmapKey, roadmap);

            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ Bulk Tasks Added Successfully!')
                .setDescription(`Added ${newTasks.length} tasks to the "${roadmap.name}" roadmap`)
                .setTimestamp()
                .setFooter({
                    text: `Total tasks in roadmap: ${roadmap.tasks.length}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Add task list to embed
            let taskList = '';
            for (let i = 0; i < Math.min(newTasks.length, 10); i++) {
                const task = newTasks[i];
                taskList += `${task.emoji} **${task.title}**\n`;
            }

            if (newTasks.length > 10) {
                taskList += `\n*... and ${newTasks.length - 10} more tasks*`;
            }

            successEmbed.addFields({
                name: '📋 Added Tasks',
                value: taskList,
                inline: false
            });

            successEmbed.addFields({
                name: '💡 Next Steps',
                value: `Use \`tasks ${roadmap.name.toLowerCase()}\` to view all tasks\nUse \`done task_number\` to mark tasks as completed`,
                inline: false
            });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in bulkaddtask command:', err);
        }
    }
};