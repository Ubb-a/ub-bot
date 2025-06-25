const { createHelpEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'help',
    description: 'Display help information and available commands',
    usage: '!help',
    
    async execute(message, args) {
        const helpEmbed = createHelpEmbed('!');
        await message.reply({ embeds: [helpEmbed] });
    }
};