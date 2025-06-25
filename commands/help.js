const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'help',
    description: 'Show detailed help information',
    usage: 'help',
    
    async execute(message, args) {
        try {
            const helpEmbed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('🤖 Bot Guide - Roadmaps')
            .setDescription('Hello! I\'m a roadmap management bot. I can help you create and manage custom learning roadmaps for your server members.')
            .addFields(
                {
                    name: '🗺️ create <roadmap_name> <@role>',
                    value: 'Create a new roadmap linked to a specific role\n**Example:** `create web-dev @Developer`',
                    inline: false
                },
                {
                    name: '📋 myroadmaps',
                    value: 'Show all roadmaps you have access to',
                    inline: false
                },
                {
                    name: '🔍 showroadmap <roadmap_name>',
                    value: 'Show details of a specific roadmap with progress bar\n**Example:** `showroadmap web-dev`',
                    inline: false
                },
                {
                    name: '❓ help',
                    value: 'Show this command list and help',
                    inline: false
                },
                {
                    name: '📝 addtask <roadmap> <task_title>',
                    value: 'Add a new task to a roadmap\n**Example:** `addtask backend Learn JavaScript`',
                    inline: false
                },
                {
                    name: '📝 bulkaddtask <roadmap> | <task1> | <task2>',
                    value: 'Add multiple tasks at once (admin only)\n**Example:** `bulkaddtask backend | Learn Node.js | Setup DB | Create API`',
                    inline: false
                },
                {
                    name: '📋 tasks [roadmap_name]',
                    value: 'Show all tasks numbered from 1 to N. If you have one roadmap, no need to specify name\n**Example:** `tasks` or `tasks backend`',
                    inline: false
                },
                {
                    name: '✅ done <task_number> [roadmap_name]',
                    value: 'Mark a task as completed by number\n**Example:** `done 2` or `done 3 backend`',
                    inline: false
                },
                {
                    name: '📊 taskstats <roadmap_name>',
                    value: 'Show member task interaction statistics (admin only)\n**Shows:** who completed which tasks',
                    inline: false
                },
                {
                    name: '🧹 clear [number]',
                    value: 'Clear chat messages (admin only)\n**Example:** `clear 10` or `clear` (deletes last 5)',
                    inline: false
                },
                {
                    name: '📬 dm <@role> <message>',
                    value: 'Send private message to all users with a specific role (admin only)\n**Example:** `dm @Developer Check the new tasks!`',
                    inline: false
                },
                {
                    name: '🗑️ deleteroadmap <roadmap_name>',
                    value: 'Delete a roadmap permanently (admin only)\n**Example:** `deleteroadmap backend`',
                    inline: false
                }
            )
            .addFields({
                name: '💡 Important Tips',
                value: '• You need "Manage Roles" permission to create new roadmaps\n• Each roadmap is linked to a specific role\n• Only members with the required role can access the roadmap\n• Use exact roadmap names (case insensitive)\n• Data is automatically saved per server\n• Commands work without the ! prefix',
                inline: false
            })
            .addFields({
                name: '🚀 Getting Started',
                value: '1. Use `create` to create a new roadmap\n2. Use `addtask` to add tasks to the roadmap\n3. Use `tasks` to view numbered tasks\n4. Use `done task_number` to complete tasks\n5. Use `taskstats` to monitor member progress (admin)\n6. Use `showroadmap` to review roadmap details',
                inline: false
            })
            .setTimestamp()
            .setFooter({
                text: 'Built with Discord.js v14',
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }));

        return message.reply({ embeds: [helpEmbed] }).catch(console.error);
        } catch (err) {
            console.error('Error in help command:', err);
        }
    }
};