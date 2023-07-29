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
    private userId: string;

    // Used to prevent API spam, if a large playlist is queued it will only create placeholders
    // for the songs which are then used to search for the song on youtube later on.
    private placeholder:boolean;

    // The votes to skip this song.
    private votes: Set<string> = new Set();
    
    // The discord AudioResource for this song.
    private resource: AudioResource | null = null;

    constructor(title: string, userId: string, duration: number = 0, url: string = "", placeholder:boolean = true) {
        this.title = title;
        this.duration = duration;
        this.url = url;
        this.placeholder = placeholder;
        this.userId = userId;
    }


   /**
    * Make sure the song has been found on youtube and it's details are saved.
    * @returns True if this was successful, false otherwise.
    */
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

    /**
     * @returns An AudioResource for this object.
     */
    public getResource(): AudioResource {
        return this.resource!;
    }

    /**
     * Get this MusicResource in a state that is ready to play (e.g retrieve it from yt) 
     * and create an AudioResource from said youtube data.
     * @returns A FunctionResult representing whether or not the resource is ready to play.
     */
    public async readyToPlay(): Promise<FunctionResult> {
        if (!await this.getData()) return { statusCode: 1, statusString: `I couldn't find \`${this.title}\` on youtube!` }
        const audioStream = await stream(this.url);
        const ar: AudioResource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type
        });
        this.resource = ar;
        return { statusCode: 0, statusString: "The content is ready to play." }
    }


    /**
     * Add a vote to skip this song.
     * @param id The discord user id of the user voting to skip.
     */
    public addVote(id: string): void { this.votes.add(id); }

    /**
     * Remove a vote to skip this song.
     * @param id The discord user id of the user being removed from the voters.
     */
    public removeVote(id: string): void { this.votes.delete(id); }


    // GETTERS AND SETTERS
    /**
     * @returns The title of this song.
     */
    public getTitle(): string { return this.title; }
    
    /**
     * @returns True if this object is a placeholder for a song that will be queried later on.
     */
    public isPlaceholder(): boolean { return this.placeholder; }

    /**
     * @returns A set of votes to skip this song.
     */
    public getVotes(): Set<string> {
        return this.votes;
    }

    public getUser(): string {
        return this.userId;
    }

}