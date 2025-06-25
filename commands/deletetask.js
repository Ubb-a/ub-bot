const { EmbedBuilder } = require('discord.js');
const { getRoadmap, saveRoadmap } = require('../utils/dataManager');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'deletetask',
    description: 'Delete a specific task from a roadmap and reorder IDs',
    usage: 'deletetask <roadmap_name> <task_id>',
    
    async execute(message, args) {
        try {
            // Check if user is mentioned or has manage roles permission
            const mentionedUsers = message.mentions.users;
            const hasManageRoles = message.member.permissions.has('ManageRoles');
            
            if (!hasManageRoles && !mentionedUsers.has(message.author.id)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ ممنوع الوصول')
                    .setDescription('محتاج صلاحية "إدارة الأدوار" أو منشن عشان تمسح مهام.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Check if arguments are provided
            if (args.length < 2) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ معلومات ناقصة')
                    .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`deletetask web-dev 3\``)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const roadmapName = args[0];
            const taskId = parseInt(args[1]);

            if (isNaN(taskId) || taskId < 1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ رقم مهمة غير صحيح')
                    .setDescription('رقم المهمة لازم يكون رقم أكبر من 0.')
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Get roadmap
            const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
            const roadmap = getRoadmap(roadmapKey);

            if (!roadmap) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ الرود ماب مش موجودة')
                    .setDescription(`مفيش رود ماب بالاسم "${roadmapName}" في السيرفر ده.`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            // Find task by ID
            const taskIndex = roadmap.tasks.findIndex(task => task.id === taskId);
            
            if (taskIndex === -1) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(COLORS.RED)
                    .setTitle('❌ المهمة مش موجودة')
                    .setDescription(`مفيش مهمة برقم ${taskId} في الرود ماب "${roadmapName}".`)
                    .setTimestamp();
                return message.reply({ embeds: [errorEmbed] });
            }

            const deletedTask = roadmap.tasks[taskIndex];

            // Remove the task
            roadmap.tasks.splice(taskIndex, 1);

            // Reorder task IDs
            roadmap.tasks.forEach((task, index) => {
                task.id = index + 1;
            });

            // Save roadmap
            saveRoadmap(roadmapKey, roadmap);

            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم مسح المهمة بنجاح!')
                .setDescription(`**المهمة المحذوفة:** ${deletedTask.title}\n**الرود ماب:** ${roadmap.name}\n**تم إعادة ترتيب أرقام المهام**`)
                .setTimestamp()
                .setFooter({
                    text: `إجمالي المهام: ${roadmap.tasks.length}`,
                    iconURL: message.guild.iconURL({ dynamic: true })
                });

            await message.reply({ embeds: [successEmbed] });

        } catch (err) {
            console.error('Error in deletetask command:', err);
        }
    }
};