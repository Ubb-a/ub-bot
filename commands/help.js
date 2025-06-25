const { EmbedBuilder } = require('discord.js');
const { COLORS } = require('../utils/embedBuilder');

module.exports = {
    name: 'help',
    description: 'Display help information and available commands',
    usage: '!help',
    
    async execute(message, args) {
        const helpEmbed = new EmbedBuilder()
            .setColor(COLORS.BLURPLE)
            .setTitle('🤖 بوت إدارة خرائط الطريق')
            .setDescription('إدارة خرائط الطريق القائمة على الأدوار مع تتبع المهام!')
            .addFields(
                {
                    name: '📝 !create <اسم_الخريطة> role:@<الرول>',
                    value: 'إنشاء خريطة طريق جديدة مع صلاحيات محددة\n**مثال:** `!create تطوير-المواقع role:@Developer`',
                    inline: false
                },
                {
                    name: '📋 !myroadmaps',
                    value: 'عرض جميع خرائط الطريق المتاحة لك حسب أدوارك\nيظهر التقدم والإحصائيات لكل خريطة',
                    inline: false
                },
                {
                    name: '🗺️ !showroadmap <اسم_الخريطة>',
                    value: 'عرض تفاصيل مفصلة عن خريطة طريق معينة\n**مثال:** `!showroadmap تطوير-المواقع`',
                    inline: false
                },
                {
                    name: '❓ !help',
                    value: 'عرض هذه القائمة من الأوامر والمساعدة',
                    inline: false
                },
                {
                    name: '📝 !addtask <خريطة> <عنوان_المهمة>',
                    value: 'إضافة مهمة جديدة لخريطة طريق\n**مثال:** `!addtask back_end تعلم JavaScript`',
                    inline: false
                },
                {
                    name: '📋 !tasks <اسم_الخريطة>',
                    value: 'عرض جميع المهام مرقمة من 1 إلى N\n**مثال:** `!tasks back_end`',
                    inline: false
                },
                {
                    name: '✅ !done <رقم_المهمة> [اسم_الخريطة]',
                    value: 'تمييز مهمة كمكتملة بالرقم\n**مثال:** `!done 2` أو `!done 3 back_end`',
                    inline: false
                },
                {
                    name: '📊 !taskstats <اسم_الخريطة>',
                    value: 'عرض إحصائيات تفاعل الأعضاء مع المهام (للإداريين فقط)\n**يعرض:** من أنجز أي مهمة ومن أخفى أي مهمة',
                    inline: false
                }
            )
            .addFields({
                name: '💡 نصائح مهمة',
                value: '• تحتاج صلاحية "إدارة الأدوار" لإنشاء خرائط طريق جديدة\n• كل خريطة طريق مرتبطة برول معين\n• يمكن للأعضاء الذين لديهم الرول المطلوب فقط الوصول للخريطة\n• استخدم أسماء الخرائط الدقيقة (غير حساسة لحالة الأحرف)\n• يتم حفظ البيانات تلقائياً لكل سيرفر',
                inline: false
            })
            .addFields({
                name: '🚀 كيفية البدء',
                value: '1. استخدم `!create` لإنشاء خريطة طريق جديدة\n2. استخدم `!addtask` لإضافة مهام للخريطة\n3. استخدم `!tasks` لعرض المهام مرقمة\n4. استخدم `!done رقم_المهمة` لإنهاء المهام\n5. استخدم `!taskstats` لمراقبة تقدم الأعضاء (للإداريين)\n6. استخدم `!showroadmap` لمراجعة تفاصيل خريطة معينة',
                inline: false
            })
            .setTimestamp()
            .setFooter({
                text: 'تم التطوير باستخدام Discord.js v14',
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }));

        return message.reply({ embeds: [helpEmbed] }).catch(console.error);
    }
};