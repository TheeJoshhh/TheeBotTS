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

const prompts = require('prompts');
import { ExtendedClient } from "../types/ExtendedClient";
import { DeployGlobalCommands, DeployGuildCommands } from "./CommandHandler";
import { authorization } from "play-dl";

export async function Controller(client: ExtendedClient) {
    const response = await prompts({
        type: 'text',
        name: 'value',
        message: 'Enter a command:',
    });
    const res: string = response.value as string;
    switch(res.toLowerCase()) {
        case 'help':
            console.log('help, shutdown, refresh guild, refresh global, play-dl');
            Controller(client);
            break;
        case 'refresh guild':
            await DeployGuildCommands(client);
            Controller(client);
            break;
        case 'refresh global':
            await DeployGlobalCommands(client);
            Controller(client);
            break;
        case 'play-dl':
            authorization();
            break;
        case 'shutdown':
            process.exit(0);
        default:
            console.log("Invalid Command! Type help for a list of commands!");
            Controller(client);
            break;
    }
}