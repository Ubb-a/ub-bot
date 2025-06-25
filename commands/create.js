const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');
const { saveRoadmap, getRoadmaps } = require('../utils/dataManager');

module.exports = {
    name: 'create',
    description: 'Create a new roadmap with role-based permissions',
    usage: '!create <roadmap_name> role:@<rolename>',
    
    async execute(message, args) {
        try {
        // Check if user has manage roles permission
        if (!message.member.permissions.has('ManageRoles')) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Access Denied')
                .setDescription('You need "Manage Roles" permission to create roadmaps.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Parse arguments
        if (args.length < 2) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ Wrong Usage')
                .setDescription(`**Usage:** ${this.usage}\n**Example:** \`!create web-dev role:@Developer\``)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Extract roadmap name and role
        let roadmapName = '';
        let roleId = null;
        let roleName = '';

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            if (arg.startsWith('role:')) {
                // Extract role from mention or name
                const roleString = arg.substring(5);
                
                if (roleString.startsWith('<@&') && roleString.endsWith('>')) {
                    // Role mention format <@&123456789>
                    roleId = roleString.slice(3, -1);
                } else if (roleString.startsWith('@')) {
                    // @RoleName format
                    roleName = roleString.substring(1);
                    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (role) {
                        roleId = role.id;
                        roleName = role.name;
                    }
                } else {
                    // Direct role name
                    roleName = roleString;
                    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (role) {
                        roleId = role.id;
                        roleName = role.name;
                    }
                }
                break;
            } else {
                roadmapName += (roadmapName ? ' ' : '') + arg;
            }
        }

        // Validate inputs
        if (!roadmapName.trim()) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ اسم خاطئ للرود ماب')
                .setDescription('اكتب اسم صحيح للرود ماب من فضلك.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        if (!roleId) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ رول غير صحيح')
                .setDescription('لم أجد الرول المطلوب. تأكد من وجود الرول وصحة الاسم.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Get role object for validation
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ الرول غير موجود')
                .setDescription('الرول المطلوب غير موجود في هذا السيرفر.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Check if roadmap already exists
        const existingRoadmaps = getRoadmaps();
        const roadmapKey = `${message.guild.id}_${roadmapName.toLowerCase()}`;
        
        if (existingRoadmaps[roadmapKey]) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ الرود ماب موجودة فعلا')
                .setDescription(`رود ماب بالاسم "**${roadmapName}**" موجودة فعلا في السيرفر ده.`)
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Create roadmap object
        const roadmap = {
            id: roadmapKey,
            name: roadmapName,
            guildId: message.guild.id,
            guildName: message.guild.name,
            roleId: role.id,
            roleName: role.name,
            createdBy: message.author.id,
            createdAt: new Date().toISOString(),
            tasks: [
                {
                    id: 1,
                    title: 'البداية',
                    description: 'مرحباً بك في الرود ماب الجديدة! يمكنك إضافة المهام باستخدام أوامر إدارة المهام.',
                    status: 'pending',
                    createdAt: new Date().toISOString()
                }
            ]
        };

        // Save roadmap
        try {
            saveRoadmap(roadmapKey, roadmap);
            
            const successEmbed = new EmbedBuilder()
                .setColor(COLORS.GREEN)
                .setTitle('✅ تم عمل الرود ماب بنجاح!')
                .setDescription(`**اسم الرود ماب:** ${roadmapName}\n**الرتبة المطلوبة:** ${role}\n**تم العمل بواسطة:** ${message.author}\n\nالناس اللي عندها رتبة ${role} تقدر توصل للرود ماب دي باستخدام \`!myroadmaps\` و \`!showroadmap ${roadmapName}\``)
                .setTimestamp();
            
            return message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Error creating roadmap:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ فشل في الإنشاء')
                .setDescription('حصل خطأ وأنت بتعمل الرود ماب. جرب تاني.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        } catch (err) {
            console.error('Error in create command:', err);
        }
    }
};
