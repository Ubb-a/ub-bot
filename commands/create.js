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
                .setTitle('❌ ممنوع الوصول')
                .setDescription('تحتاج صلاحية "إدارة الأدوار" لإنشاء خرائط الطريق.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }

        // Parse arguments
        if (args.length < 2) {
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ استخدام خاطئ')
                .setDescription(`**الاستخدام:** ${this.usage}\n**مثال:** \`!create تطوير-المواقع role:@Developer\``)
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
                .setTitle('❌ اسم خاطئ للخريطة')
                .setDescription('من فضلك اكتب اسم صحيح لخريطة الطريق.')
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
                .setTitle('❌ الخريطة موجودة بالفعل')
                .setDescription(`خريطة طريق بالاسم "**${roadmapName}**" موجودة بالفعل في هذا السيرفر.`)
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
                    description: 'مرحباً بك في خريطة الطريق الجديدة! يمكنك إضافة المهام باستخدام أوامر إدارة المهام.',
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
                .setTitle('✅ تم إنشاء خريطة الطريق بنجاح!')
                .setDescription(`**اسم الخريطة:** ${roadmapName}\n**الرول المطلوب:** ${role}\n**تم الإنشاء بواسطة:** ${message.author}\n\nيمكن للأعضاء الذين لديهم رول ${role} الوصول لهذه الخريطة باستخدام \`!myroadmaps\` و \`!showroadmap ${roadmapName}\``)
                .setTimestamp();
            
            return message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Error creating roadmap:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(COLORS.RED)
                .setTitle('❌ فشل في الإنشاء')
                .setDescription('حدث خطأ أثناء إنشاء خريطة الطريق. حاول مرة أخرى.')
                .setTimestamp();
            return message.reply({ embeds: [errorEmbed] });
        }
        } catch (err) {
            console.error('Error in create command:', err);
        }
    }
};
