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
import { FunctionResult } from '../../types/FunctionResult';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays music in your voice channel!')
        .setDMPermission(false)
        .addStringOption(option =>
			option
				.setName('query')
				.setDescription('The song you would like to play.')
                .setRequired(true)),
    category: "Music",
    userCooldown: 3,
    guildCooldown: 0,
    async execute(client: ExtendedClient, interaction: Interaction) {
        // Make sure the command is a chat imput command and was send in a guild.
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inGuild()) return;

        await interaction.deferReply();

        // Store some unseful info.
        const guild: Guild = interaction.guild!;
        const member: GuildMember = interaction.member as GuildMember;
        const voice_channel: VoiceBasedChannel | null = member.voice.channel;
        const text_channel: TextBasedChannel = interaction.channel!;

        // If there isn't already a MusicPlayer for the guild.
        if (!music.has(guild.id)) {
            // Make sure the user is in a visible voice channel.
            if (!voice_channel) { 
                interaction.editReply('I can\'t see you in a voice channel!'); 
                return;
            }
            // Make sure the users voice channel is joinable to me.
            if (!voice_channel.joinable) {
                interaction.editReply('I don\'t have permissions to join your channel!');
                return;
            }
        }

        // Get the query and create a resource with it.
        const query:string = interaction.options.getString('query')!;
        
        // Create the music player if needed, and store it.
        if (!music.has(guild.id)) new MusicPlayer(voice_channel!, text_channel);
        let mp: MusicPlayer|undefined = music.get(guild.id);

        // If the MusicPlayer destroyed itself, return an error message.
        if (mp === null) {
            interaction.editReply('Failed to join your channel!');
            return;
        } 

        const res: FunctionResult = await mp!.addQueue(query);

        interaction.editReply(res.statusString);
        
    }
} as Command;