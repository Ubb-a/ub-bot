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
        
        // Split by "T:" to separate different topics
        const topicSections = input.split(/(?=\s+T:)/);
        
        for (const section of topicSections) {
            if (!section.trim()) continue;
            
            // Extract topic from T:topicname
            const topicMatch = section.match(/T:(\w+)/);
            if (!topicMatch) continue;
            
            const topic = topicMatch[1];
            const remainingContent = section.replace(/T:\w+\s*/, '');
            
            // Parse tasks in this topic section
            const sectionTasks = this.parseTasksInTopicSection(remainingContent, topic);
            tasks.push(...sectionTasks);
        }
        
        return tasks;
    },
    
    parseTasksInTopicSection(content, topic) {
        const tasks = [];
        const parts = [];
        let currentPart = '';
        let insideLink = false;
        let linkStarted = false;
        
        // Split content into words but preserve link structure
        const words = content.split(/\s+/);
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            
            if (word.startsWith('link:')) {
                // Start of link - finish current task and start link collection
                insideLink = true;
                linkStarted = true;
                currentPart += ' ' + word;
                
                // Continue collecting until we hit a word that's not part of URLs/commas
                i++;
                while (i < words.length) {
                    const nextWord = words[i];
                    // If it's a URL, comma, or continues the link pattern, include it
                    if (nextWord.includes('http') || nextWord.startsWith(',') || 
                        nextWord.includes('.com') || nextWord.includes('.org') || 
                        nextWord.includes('.net') || nextWord.includes('.edu') ||
                        nextWord === ',' || nextWord.endsWith(',')) {
                        currentPart += ' ' + nextWord;
                        i++;
                    } else {
                        // This word is not part of the link, back up and break
                        i--;
                        break;
                    }
                }
                
                // End the current task with its link
                if (currentPart.trim()) {
                    parts.push(currentPart.trim());
                    currentPart = '';
                }
                insideLink = false;
            } else if (!insideLink) {
                // Regular task content
                if (currentPart) currentPart += ' ';
                currentPart += word;
            }
        }
        
        // Add the last part if it exists
        if (currentPart.trim()) {
            parts.push(currentPart.trim());
        }
        
        // Convert parts to task objects
        for (const part of parts) {
            const taskData = this.extractTaskAndLinks(part);
            if (taskData.title) {
                tasks.push({
                    title: taskData.title,
                    topic: topic,
                    links: taskData.links
                });
            }
        }
        
        return tasks;
    },
    
    extractTaskAndLinks(taskString) {
        const linkMatch = taskString.match(/^(.+?)\s+link:(.+)$/);
        
        if (linkMatch) {
            const title = linkMatch[1].trim();
            const linksString = linkMatch[2].trim();
            
            // Clean up the links string and split by comma
            const cleanLinksString = linksString.replace(/\s*,\s*/g, ',');
            const links = cleanLinksString.split(',')
                .map(link => link.trim())
                .filter(link => link.length > 0);
            
            return {
                title: title,
                links: links
            };
        } else {
            return {
                title: taskString.trim(),
                links: []
            };
        }
    }
};