/*
    A discord bot providing some basic features!
    Copyright (C) 2023  Joshua Billing

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { SlashCommandBuilder, Interaction, EmbedBuilder, Embed } from 'discord.js';
import { Command } from '../../types/Command';
import { ExtendedClient } from '../../types/ExtendedClient';
import { music } from '../../util/MusicPlayer';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue.')
        .setDMPermission(false)
        .addIntegerOption(option => 
            option
                .setName('page')
                .setMinValue(1)
                .setDescription('The page of the queue.')
        ),
    category: 'Music',
    userCooldown: 3,
    guildCooldown: 0,
    async execute(client: ExtendedClient, interaction: Interaction) {
        // Make sure the command is a chat input command, or button and was sent in a guild.
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inGuild()) return;

        // Make sure the bot is playing music.
        if (!music.has(interaction.guild!.id)) {
            interaction.reply({ content: "I'm not playing music!", ephemeral: true });
            return;
        }

        // Get an array of song titles.
        const songs = music.get(interaction.guild?.id!)!.getQueue()
        .map(song=>song.getTitle());
            
        // Get the page and total number of pages.
        const page = interaction.options.getInteger('page') ?? 1;
        const pages: number = Math.ceil(songs.length/10);
        
        // Make sure page is in bounds.
        if (page! < 1 || page! > pages) {
            interaction.reply({ content: "That page doesn't exist!", ephemeral: true });
            return;
        }

        // Generate a numbered list of song titles for the current page.
        let str = '';
        const pageSongs = songs.slice((page!-1)*10, Math.min(songs.length, page!*10));
        for (let i = 0; i < pageSongs.length; i++) {
            if (page === 1 && i === 0) str += `Playing: ${pageSongs[i]}`;
            else {
                if (i !== 0) str += '\n';
                str += `${(page!-1)*10+i+1}. ${pageSongs[i]}`;
            }
        }
        
        // Create an embed.
        const embed = new EmbedBuilder()
        .setTitle(`Queue for ${interaction.guild?.name}`)
        .setDescription(str)
        .setFooter({ text: `Page ${page!} of ${pages}` });

        interaction.reply({embeds:[embed]});
       
    }
} as Command;