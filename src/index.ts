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

// Import required modules.
import { Client, Events, Collection, GatewayIntentBits } from 'discord.js';
import { token } from './config.json';
import { ExtendedClient } from './types/ExtendedClient'
import { Command } from './types/Command';
import { LoadCommands } from './util/CommandHandler';
import { Controller } from './util/Controller';
const play = require('play-dl');

// Create a Discord Client and provide intents.
const client = new Client({
    intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates ]
}) as ExtendedClient; // Allows extra data to be attached to the client.

// Once the bot is online.
client.once(Events.ClientReady, c => {
    console.log(`TheeBotTS is online and ready!\nLogged in as ${c.user.tag}`);
    console.log(`Currently in ${client.guilds.cache.size} guilds!`);
    LoadCommands(client);
    Controller(client);
});

client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isChatInputCommand()) return;
	const cmd = client.commands.get(interaction.commandName);
    console.log(`Received the command: ${interaction.commandName}`);
    return cmd?.execute(client, interaction);
});

client.login(token);