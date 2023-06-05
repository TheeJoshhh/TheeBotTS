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

import { AudioResource, createAudioResource } from "@discordjs/voice";
import { search, stream } from 'play-dl';
import { FunctionResult } from "../types/FunctionResult";

export class MusicResource {
    // Basic info.
    private title: string;
    private duration: number;
    private url: string;

    private placeholder:boolean;

    private votes: Set<string> = new Set();
    
    private resource: AudioResource | null = null;

    constructor(title: string, duration: number = 0, url: string = "", placeholder:boolean = true) {
        this.title = title;
        this.duration = duration;
        this.url = url;
        this.placeholder = placeholder;
    }


    // Get information about the song.
    private async getData(): Promise<boolean> {
        if (!this.placeholder) return true;
        const yt_search = await search(this.title, {limit: 1});
        if (yt_search.length < 1) return false;
        this.title = yt_search[0].title!;
        this.duration = yt_search[0].durationInSec;
        this.url = yt_search[0].url;
        this.placeholder = false;
        return true;
    } 


    public getResource(): AudioResource {
        return this.resource!;
    }


    public async readyToPlay(): Promise<FunctionResult> {
        if (!await this.getData()) return { statusCode: 1, statusString: `I couldn't find \`${this.title}\` on youtube!` }
        const audioStream = await stream(this.url);
        const ar: AudioResource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type
        });
        this.resource = ar;
        return { statusCode: 0, statusString: "The content is ready to play." }
    }


    // GETTERS AND SETTERS
    // The title of the song.
    public getTitle(): string { return this.title; }
    
    // If this object is a placeholder for a song that will be queried later on.
    public isPlaceholder(): boolean { return this.placeholder; }

    // Add and remove votes to skip.
    public addVote(id: string): void { this.votes.add(id); }
    public removeVote(id: string): void { this.votes.delete(id); }
}