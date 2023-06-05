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

import { SlashCommandBuilder, Interaction, GuildMember, Guild, VoiceBasedChannel, TextBasedChannel } from 'discord.js';
import { Command } from '../../types/Command';
import { ExtendedClient } from '../../types/ExtendedClient';
import { music } from '../../util/MusicPlayer';
import { FunctionResult } from '../../types/FunctionResult';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Vote to skip the current song.')
        .setDMPermission(false),
    category: "Music",
    userCooldown: 3,
    guildCooldown: 0,
    async execute(client: ExtendedClient, interaction: Interaction) {
        // Make sure the command is a chat input command and was send in a guild.
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inGuild()) return;

        // Make sure the bot is playing music.
        if (!music.has(interaction.guild!.id)) {
            interaction.reply({ content: "I'm not playing music!", ephemeral: true });
        }

        const res: FunctionResult = music.get(interaction.guild!.id)!.voteSkip(interaction.member.user.id);

        if (res.statusCode === 0) {
            interaction.reply(res.statusString);
        } else {
            interaction.reply({ content: res.statusString, ephemeral: true });
        }

    }
} as Command;