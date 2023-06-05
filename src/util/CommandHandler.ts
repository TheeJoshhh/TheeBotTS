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

import * as path from 'node:path';
import * as fs from 'node:fs';
import { Collection, REST, Routes } from 'discord.js';
import { clientId, guildId, token } from '../config.json';
import { Command } from "../types/Command";
import { ExtendedClient } from "../types/ExtendedClient";
const rest = new REST().setToken(token);

export function LoadCommands(client: ExtendedClient) {
    const commands = new Collection<string, Command>();
    const foldersPath = path.join(__dirname, '../commands');
    const commandFolders = fs.readdirSync(foldersPath);

    // Loop over the folders in the command folder.
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command: Command = require(filePath);
            commands.set(command.data.name, command);
        }
    }
    client.commands = commands;
}

export async function DeployGuildCommands(client: ExtendedClient) {
    const commands = Array.from(client.commands.values()).map(cmd=>cmd.data.toJSON());
    try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded application (/) commands.`);
	} catch (error) { console.error(error); }
}


export async function DeployGlobalCommands(client: ExtendedClient) {
    const commands = Array.from(client.commands.values()).map(cmd=>cmd.data.toJSON());
    try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

		console.log(`Successfully reloaded application (/) commands.`);
	} catch (error) { console.error(error); }
}