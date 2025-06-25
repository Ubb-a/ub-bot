const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'bulkaddtask',
    description: 'Add multiple tasks to a roadmap at once with topics and optional links',
    usage: 'bulkaddtask <roadmap_name> <week_number> T:<topic> task1 link:url1,url2 task2 T:<new_topic> task3...',
    
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
                    .setDescription('**Usage:** `bulkaddtask roadmap_name week_number T:<topic> task1 link:url1,url2 task2 T:<new_topic> task3`\n**Example:** `bulkaddtask backend 2 T:Node.js Learn basics link:url1,url2 Setup server T:Database Create models`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const fullInput = args.join(' ');
            
            // Parse roadmap name and week number
            const parts = fullInput.split(' ');
            if (parts.length < 3) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Wrong Format')
                    .setDescription('**Usage:** `bulkaddtask roadmap_name week_number T:<topic> task1 task2`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Find where the week number is (it should be a number)
            let weekIndex = -1;
            let weekNumber = NaN;
            
            for (let i = 1; i < parts.length; i++) {
                const num = parseInt(parts[i]);
                if (!isNaN(num) && num >= 1 && num <= 52) {
                    weekNumber = num;
                    weekIndex = i;
                    break;
                }
            }

            if (weekIndex === -1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Invalid Week Number')
                    .setDescription('Week number must be between 1 and 52.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = parts.slice(0, weekIndex).join(' ');
            const tasksInput = parts.slice(weekIndex + 1).join(' ');

            if (!tasksInput.trim()) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ No Tasks Provided')
                    .setDescription('Please provide at least one task with a topic.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Parse tasks with topics and links
            const parsedTasks = this.parseTasksInput(tasksInput);
            
            if (parsedTasks.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ No Valid Tasks Found')
                    .setDescription('Please provide tasks in the correct format: T:<topic> task1 link:url1,url2 task2')
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

            // Create tasks
            const newTasks = [];
            let currentTaskId = roadmap.tasks.length > 0 ? Math.max(...roadmap.tasks.map(t => t.id)) + 1 : 1;

            for (const taskData of parsedTasks) {
                const newTask = {
                    id: currentTaskId,
                    title: taskData.title,
                    description: taskData.title,
                    status: 'pending',
                    createdBy: message.author.id,
                    weekNumber: weekNumber,
                    topic: taskData.topic,
                    links: taskData.links,
                    createdAt: new Date().toISOString(),
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
                .setDescription(`Added ${newTasks.length} tasks to the "${roadmap.name}" roadmap for Week ${weekNumber}`)
                .setTimestamp()
                .setFooter({
                    text: `Total tasks in roadmap: ${roadmap.tasks.length}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            // Group tasks by topic for display
            const tasksByTopic = {};
            newTasks.forEach(task => {
                if (!tasksByTopic[task.topic]) {
                    tasksByTopic[task.topic] = [];
                }
                tasksByTopic[task.topic].push(task);
            });

            // Add task list to embed grouped by topic
            let taskList = '';
            for (const [topic, tasks] of Object.entries(tasksByTopic)) {
                taskList += `**${topic}:**\n`;
                tasks.forEach(task => {
                    taskList += `  ${task.id}. ${task.title}`;
                    if (task.links && task.links.length > 0) {
                        taskList += ` 🔗`;
                    }
                    taskList += '\n';
                });
                taskList += '\n';
            }

            successEmbed.addFields({
                name: '📋 Added Tasks',
                value: taskList.trim() || 'No tasks to display',
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
    },

    parseTasksInput(input) {
        const tasks = [];
        let currentTopic = null;
        
        // Split input by spaces but keep track of links
        const tokens = input.split(' ');
        let i = 0;
        
        while (i < tokens.length) {
            const token = tokens[i];
            
            // Check if this is a topic definition
            if (token.startsWith('T:')) {
                currentTopic = token.substring(2);
                i++;
                continue;
            }
            
            // Check if this is a link definition
            if (token.startsWith('link:')) {
                // This shouldn't happen at the start, skip
                i++;
                continue;
            }
            
            // This should be a task title
            if (currentTopic) {
                let taskTitle = '';
                let links = [];
                
                // Collect task title until we hit a link or next topic
                while (i < tokens.length && !tokens[i].startsWith('T:') && !tokens[i].startsWith('link:')) {
                    if (taskTitle) taskTitle += ' ';
                    taskTitle += tokens[i];
                    i++;
                }
                
                // Check if next token is a link
                if (i < tokens.length && tokens[i].startsWith('link:')) {
                    const linkData = tokens[i].substring(5); // Remove 'link:'
                    links = linkData.split(',').map(link => link.trim()).filter(link => link.length > 0);
                    i++;
                }
                
                if (taskTitle.trim()) {
                    tasks.push({
                        title: taskTitle.trim(),
                        topic: currentTopic,
                        links: links
                    });
                }
            } else {
                // No topic defined yet, skip this token
                i++;
            }
        }
        
        return tasks;
    }
};