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
            .setDescription('أهلا وسهلا! أنا بوت إدارة الرود ماب. أقدر أساعدك تعمل وتتحكم في رود ماب تعليمية مخصوصة للي في السيرفر.')
            .addFields(
                {
                    name: '🗺️ create <اسم_الرود_ماب> <@الرتبة>',
                    value: 'عمل رود ماب جديدة مربوطة برتبة معينة\n**مثال:** `create web-dev @Developer`',
                    inline: false
                },
                {
                    name: '📋 myroadmaps',
                    value: 'شوف كل الرود ماب الموجودة عندك',
                    inline: false
                },
                {
                    name: '🔍 showroadmap <اسم_الرود_ماب>',
                    value: 'شوف تفاصيل رود ماب معينة مع بار التقدم\n**مثال:** `showroadmap web-dev`',
                    inline: false
                },
                {
                    name: '❓ help',
                    value: 'شوف قايمة الأوامر والمساعدة',
                    inline: false
                },
                {
                    name: '📊 poll <السؤال> | <خيار1> | <خيار2>',
                    value: 'عمل استطلاع رأي بخيارات متعددة (للأدمن بس)\n**مثال:** `poll إيه أحسن لغة؟ | JavaScript | Python | Java`',
                    inline: false
                },
                {
                    name: '🗳️ vote <السؤال>',
                    value: 'عمل تصويت بسيط بـ موافق/مش موافق (للأدمن بس)\n**مثال:** `vote هل نغير لون السيرفر؟`',
                    inline: false
                },
                {
                    name: '📅 schedule <رود_ماب> | <مهمة> | <وصف> | <يوم>',
                    value: 'جدولة مهام أسبوعية (للأدمن بس)\n**مثال:** `schedule web-dev | مراجعة | راجع الأسبوع | monday`',
                    inline: false
                },
                {
                    name: '📝 addtask <الرود_ماب> <عنوان_المهمة>',
                    value: 'زود مهمة جديدة للرود ماب\n**مثال:** `addtask backend اتعلم JavaScript`',
                    inline: false
                },
                {
                    name: '📝 bulkaddtask <الرود_ماب> | <مهمة1> | <مهمة2>',
                    value: 'زود كام مهمة مع بعض (للأدمن بس)\n**مثال:** `bulkaddtask backend | اتعلم Node.js | اعمل قاعدة بيانات | اعمل API`',
                    inline: false
                },
                {
                    name: '📋 tasks [اسم_الرود_ماب]',
                    value: 'شوف كل المهام مرقمة من 1 لـ N. لو عندك رود ماب واحدة، مش محتاج تكتب الاسم\n**مثال:** `tasks` أو `tasks backend`',
                    inline: false
                },
                {
                    name: '✅ done <رقم_المهمة> [اسم_الرود_ماب]',
                    value: 'خلص مهمة برقمها\n**مثال:** `done 2` أو `done 3 backend`',
                    inline: false
                },
                {
                    name: '📊 taskstats <اسم_الرود_ماب>',
                    value: 'شوف إحصائيات تفاعل الناس مع المهام (للأدمن بس)\n**بيوضح:** مين خلص إيه من المهام',
                    inline: false
                },
                {
                    name: '🧹 clear [عدد]',
                    value: 'امسح رسايل الشات (للأدمن بس)\n**مثال:** `clear 10` أو `clear` (بيمسح آخر 5)',
                    inline: false
                },
                {
                    name: '📬 dm <@الرتبة> <الرسالة>',
                    value: 'ابعت رسالة خاصة لكل الناس اللي عندها رتبة معينة (للأدمن بس)\n**مثال:** `dm @Developer شوفوا المهام الجديدة!`',
                    inline: false
                },
                {
                    name: '🗑️ deleteroadmap <اسم_الرود_ماب>',
                    value: 'امسح رود ماب خالص (للأدمن بس)\n**مثال:** `deleteroadmap backend`',
                    inline: false
                }
            )
            .addFields({
                name: '💡 نصايح مهمة',
                value: '• محتاج صلاحية "Manage Roles" عشان تعمل رود ماب جديدة\n• كل رود ماب مربوطة برتبة معينة\n• بس الناس اللي عندها الرتبة المطلوبة تقدر توصل للرود ماب\n• استعمل أسماء الرود ماب بالظبط\n• البيانات بتتحفظ لوحدها لكل سيرفر\n• الأوامر تشتغل من غير علامة "!" أو مع "يا سمكري"',
                inline: false
            })
            .addFields({
                name: '🚀 إزاي تبدأ',
                value: '1. استعمل `create` عشان تعمل رود ماب جديدة\n2. استعمل `addtask` عشان تزود مهام للرود ماب\n3. استعمل `tasks` عشان تشوف المهام مرقمة\n4. استعمل `done رقم_المهمة` عشان تخلص المهام\n5. استعمل `taskstats` عشان تتابع تقدم الناس (أدمن)\n6. استعمل `showroadmap` عشان تراجع تفاصيل الرود ماب',
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