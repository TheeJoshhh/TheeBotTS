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

import { SlashCommandBuilder, Interaction } from 'discord.js';
import { Command } from '../../types/Command';
import { ExtendedClient } from '../../types/ExtendedClient';
import { MusicPlayer, music } from '../../util/MusicPlayer';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Loop the queue until loop is disabled.')
        .setDMPermission(false),
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

        const mp: MusicPlayer|undefined = music.get(interaction.guild?.id!);

        // Double check the music player is correct.
        if (mp instanceof MusicPlayer === false) {
            interaction.reply({ content: "I'm not playing music!", ephemeral: true });
            return;
        }

        // Toggle loop.
        mp!.loop = !mp!.loop;
        const loopStr = mp!.loop ? "enabled" : "disabled"
        interaction.reply({ content: `Loop mode was ${loopStr}!` });
    }
} as Command;