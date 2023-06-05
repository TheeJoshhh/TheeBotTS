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

import { SlashCommandBuilder, Interaction, ChatInputCommandInteraction, GuildMember, Guild, VoiceChannel, VoiceBasedChannel, TextBasedChannel } from 'discord.js';
import { Command } from '../../types/Command';
import { ExtendedClient } from '../../types/ExtendedClient';
import { MusicPlayer, music } from '../../util/MusicPlayer';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Joins your voice channel!')
        .setDMPermission(false),
    category: "Music",
    userCooldown: 3,
    guildCooldown: 0,
    async execute(client: ExtendedClient, interaction: Interaction) {
        // Make sure the command is a chat imput command and was send in a guild.
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inGuild()) return;

        // Store the guild object.
        const guild: Guild = interaction.guild!;

        // If the guild already has a MusicPlayer.
        if (music.has(guild.id)) {
            const player: MusicPlayer = music.get(guild.id)!;
            const valid: boolean = player.validate();
            // If the player is broken, delete it.
            // If the player isn't broken, tell the user I'm already in a channel.
            if (!valid) player.destroy();
            else {
                interaction.reply('I\'m already in a voice channel!');
                return;
            }
        }

        const member: GuildMember = interaction.member as GuildMember;
        const voice_channel: VoiceBasedChannel | null = member.voice.channel;
        const text_channel: TextBasedChannel = interaction.channel!;
        
        if (!voice_channel) { 
            interaction.reply('I can\'t see you in a voice channel!'); 
            return;
        }

        if (!voice_channel.joinable) {
            interaction.reply('I don\'t have permissions to join your channel!'); 
            return;
        }

        new MusicPlayer(voice_channel, text_channel);
        if (!music.has(guild.id)) {
            interaction.reply('Failed to join your channel!');
            return;
        } else {
            interaction.reply('Joining your channel!');
            return;
        }
    }
} as Command;