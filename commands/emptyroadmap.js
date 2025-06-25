const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');

module.exports = {
    name: 'emptyroadmap',
    description: 'Empty all tasks from a roadmap (admin only)',
    usage: 'emptyroadmap <roadmap_name>',
    
    async execute(message, args) {
        try {
            // Check if user has admin permissions
            if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Permission Denied')
                    .setDescription('You need "Manage Roles" permission to empty roadmaps.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if roadmap name is provided
            if (args.length === 0) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ Missing Roadmap Name')
                    .setDescription('**Usage:** `emptyroadmap roadmap_name`\n**Example:** `emptyroadmap backend`')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args.join(' ');
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
                    .setDescription(`You need the ${role ? role.toString() : 'required'} role to empty this roadmap.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const taskCount = roadmap.tasks.length;

            // Confirmation embed
            const confirmEmbed = new EmbedBuilder()
                .setColor(COLORS.YELLOW)
                .setTitle('⚠️ Confirm Roadmap Empty')
                .setDescription(`Are you sure you want to empty **${roadmap.name}**?\n\n**This will delete ${taskCount} tasks permanently.**\n\nReact with ✅ to confirm or ❌ to cancel.`)
                .setTimestamp()
                .setFooter({
                    text: 'This action cannot be undone',
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            const confirmMessage = await message.reply({ embeds: [confirmEmbed] });
            
            // Add reactions
            await confirmMessage.react('✅');
            await confirmMessage.react('❌');

            // Wait for user reaction
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            try {
                const collected = await confirmMessage.awaitReactions({ 
                    filter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });

                const reaction = collected.first();

                if (reaction.emoji.name === '✅') {
                    // Empty the roadmap
                    roadmap.tasks = [];
                    saveRoadmap(roadmapKey, roadmap);

                    const successEmbed = new EmbedBuilder()
                        .setColor(COLORS.GREEN)
                        .setTitle('✅ Roadmap Emptied Successfully!')
                        .setDescription(`**${roadmap.name}** has been emptied.\n\n**Deleted:** ${taskCount} tasks`)
                        .setTimestamp()
                        .setFooter({
                            text: `Emptied by ${message.author.username}`,
                            iconURL: message.author.displayAvatarURL({ dynamic: true })
                        });

                    await confirmMessage.edit({ embeds: [successEmbed] });
                    await confirmMessage.reactions.removeAll();

                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor(COLORS.GRAY)
                        .setTitle('❌ Operation Cancelled')
                        .setDescription('Roadmap empty operation has been cancelled.')
                        .setTimestamp();

                    await confirmMessage.edit({ embeds: [cancelEmbed] });
                    await confirmMessage.reactions.removeAll();
                }

            } catch (error) {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(COLORS.GRAY)
                    .setTitle('⏰ Confirmation Timeout')
                    .setDescription('Operation cancelled due to timeout (30 seconds).')
                    .setTimestamp();

                await confirmMessage.edit({ embeds: [timeoutEmbed] });
                await confirmMessage.reactions.removeAll();
            }

        } catch (err) {
            console.error('Error in emptyroadmap command:', err);
        }
    }
};