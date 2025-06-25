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
                    name: '🔍 showroadmap [اسم_الرود_ماب]',
                    value: 'شوف الرود ماب حسب رتبتك (لو عندك أكتر من واحدة اكتب الاسم)\n**مثال:** `showroadmap` أو `showroadmap web-dev`',
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
                    name: '📅 schedule <roadmap> | <task> | <description> | <day>',
                    value: 'Schedule weekly tasks (admin only)\n**Example:** `schedule web-dev | Review | Weekly review | monday`',
                    inline: false
                },
                {
                    name: '➕ addtask <roadmap> <week> <task> [link: <url>]',
                    value: 'Add new task with optional link (mention or admin)\n**Example:** `addtask web-dev 2 Learn HTML link: https://example.com`',
                    inline: false
                },
                {
                    name: '🗑️ deletetask <roadmap> <task_number>',
                    value: 'Delete specific task and reorder IDs (mention or admin)\n**Example:** `deletetask web-dev 3`',
                    inline: false
                },
                {
                    name: '📦 bulkaddtask <roadmap> <week> , <task1> , <task2>',
                    value: 'Add multiple tasks to specific week\n**Example:** `bulkaddtask web-dev 1 , HTML , CSS , JavaScript`',
                    inline: false
                },
                {
                    name: '📋 tasks [roadmap_name]',
                    value: 'View all tasks numbered 1 to N. If you have one roadmap, no need to specify name\n**Example:** `tasks` or `tasks backend`',
                    inline: false
                },
                {
                    name: '✅ done <task_number> [roadmap_name]',
                    value: 'Complete task by its number\n**Example:** `done 2` or `done 3 backend`',
                    inline: false
                },
                {
                    name: '📊 taskstats <roadmap_name>',
                    value: 'View task interaction statistics (admin only)\n**Shows:** Who completed which tasks',
                    inline: false
                },
                {
                    name: '🧹 clear [number]',
                    value: 'Clear chat messages (admin only)\n**Example:** `clear 10` or `clear` (clears last 5)',
                    inline: false
                },
                {
                    name: '📬 dm <@role> <message>',
                    value: 'Send private message to all users with specific role (admin only)\n**Example:** `dm @Developer Check new tasks!`',
                    inline: false
                },
                {
                    name: '🗑️ deleteroadmap <roadmap_name>',
                    value: 'Delete roadmap completely (admin only)\n**Example:** `deleteroadmap backend`',
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