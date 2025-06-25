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
            .setTitle('🤖 السمكري - دليل المساعدة')
            .setDescription('أهلاً! أنا بوت إدارة خرائط الطريق. أقدر أساعدك تنشئ وتدير خرائط تعليمية مخصصة لأعضاء السيرفر.')
            .addFields(
                {
                    name: '🗺️ create <اسم_الخريطة> <@الرتبة>',
                    value: 'إنشاء خريطة طريق جديدة مربوطة برتبة معينة\n**مثال:** `create web-dev @Developer`',
                    inline: false
                },
                {
                    name: '📋 myroadmaps',
                    value: 'عرض جميع خرائط الطريق المتاحة لك',
                    inline: false
                },
                {
                    name: '🔍 showroadmap <اسم_الخريطة>',
                    value: 'عرض تفاصيل خريطة طريق معينة مع شريط التقدم\n**مثال:** `showroadmap web-dev`',
                    inline: false
                },
                {
                    name: '❓ help',
                    value: 'عرض قائمة الأوامر والمساعدة',
                    inline: false
                },
                {
                    name: '📝 addtask <الخريطة> <عنوان_المهمة>',
                    value: 'إضافة مهمة جديدة لخريطة الطريق\n**مثال:** `addtask backend تعلم JavaScript`',
                    inline: false
                },
                {
                    name: '📝 bulkaddtask <الخريطة> | <مهمة1> | <مهمة2>',
                    value: 'إضافة عدة مهام مرة واحدة (للإدارة فقط)\n**مثال:** `bulkaddtask backend | تعلم Node.js | إعداد قاعدة البيانات | إنشاء API`',
                    inline: false
                },
                {
                    name: '📋 tasks [اسم_الخريطة]',
                    value: 'عرض جميع المهام مرقمة من 1 إلى N. إذا كان لك خريطة واحدة، لا حاجة لتحديد الاسم\n**مثال:** `tasks` أو `tasks backend`',
                    inline: false
                },
                {
                    name: '✅ done <رقم_المهمة> [اسم_الخريطة]',
                    value: 'تسجيل إتمام مهمة برقمها\n**مثال:** `done 2` أو `done 3 backend`',
                    inline: false
                },
                {
                    name: '📊 taskstats <اسم_الخريطة>',
                    value: 'عرض إحصائيات تفاعل الأعضاء مع المهام (للإدارة فقط)\n**يعرض:** من أتم أي مهام',
                    inline: false
                },
                {
                    name: '🧹 clear [عدد]',
                    value: 'مسح رسائل المحادثة (للإدارة فقط)\n**مثال:** `clear 10` أو `clear` (يحذف آخر 5)',
                    inline: false
                },
                {
                    name: '📬 dm <@الرتبة> <الرسالة>',
                    value: 'إرسال رسالة خاصة لجميع أصحاب رتبة معينة (للإدارة فقط)\n**مثال:** `dm @Developer شوفوا المهام الجديدة!`',
                    inline: false
                },
                {
                    name: '🗑️ deleteroadmap <اسم_الخريطة>',
                    value: 'حذف خريطة طريق نهائياً (للإدارة فقط)\n**مثال:** `deleteroadmap backend`',
                    inline: false
                }
            )
            .addFields({
                name: '💡 نصائح مهمة',
                value: '• تحتاج صلاحية "Manage Roles" لإنشاء خرائط جديدة\n• كل خريطة مربوطة برتبة معينة\n• فقط الأعضاء الذين لديهم الرتبة المطلوبة يمكنهم الوصول للخريطة\n• استخدم أسماء الخرائط بدقة\n• البيانات تُحفظ تلقائياً لكل سيرفر\n• الأوامر تعمل بدون علامة "!" أو مع "يا سمكري"',
                inline: false
            })
            .addFields({
                name: '🚀 كيفية البداية',
                value: '1. استخدم `create` لإنشاء خريطة جديدة\n2. استخدم `addtask` لإضافة مهام للخريطة\n3. استخدم `tasks` لعرض المهام مرقمة\n4. استخدم `done رقم_المهمة` لإتمام المهام\n5. استخدم `taskstats` لمراقبة تقدم الأعضاء (إدارة)\n6. استخدم `showroadmap` لمراجعة تفاصيل الخريطة',
                inline: false
            })
            .setTimestamp()
            .setFooter({
                text: 'السمكري - مطور بـ Discord.js v14',
                iconURL: message.guild.iconURL({ dynamic: true })
            })
            .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }));

        return message.reply({ embeds: [helpEmbed] }).catch(console.error);
        } catch (err) {
            console.error('Error in help command:', err);
        }
    }
};