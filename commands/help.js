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
            .setTitle('🤖 Samkari - Help Guide')
            .setDescription('Welcome! I am a roadmap management bot. I can help you create and manage educational roadmaps customized for server members.')
            .addFields(
                {
                    name: '🗺️ create <roadmap_name> <@role>',
                    value: 'Create new roadmap linked to specific role\n**Example:** `create web-dev @Developer`',
                    inline: false
                },
                {
                    name: '📋 myroadmaps',
                    value: 'View all your available roadmaps',
                    inline: false
                },
                {
                    name: '🔍 showroadmap [roadmap_name]',
                    value: 'View roadmap based on your role (if you have multiple, specify name)\n**Example:** `showroadmap` or `showroadmap web-dev`',
                    inline: false
                },
                {
                    name: '❓ help',
                    value: 'View command list and help',
                    inline: false
                },
                {
                    name: '📊 poll <question> | <option1> | <option2>',
                    value: 'Create poll with multiple options (admin only)\n**Example:** `poll What\'s the best language? | JavaScript | Python | Java`',
                    inline: false
                },
                {
                    name: '🗳️ vote <question>',
                    value: 'Create simple yes/no vote (admin only)\n**Example:** `vote Should we change server color?`',
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
                },
                {
                    name: '🧹 emptyroadmap <roadmap_name>',
                    value: 'Empty all tasks from roadmap (admin only)\n**Example:** `emptyroadmap backend`',
                    inline: false
                },
                {
                    name: '📤 autopost <channel_id> <msg1> | <msg2> | <msg3>',
                    value: 'Setup automatic posting every minute (admin only)\n**Example:** `autopost 123456 Hello! | Good morning! | How are you?`\n**Stop:** `autopost stop`',
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