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

import { joinVoiceChannel, VoiceConnection, AudioPlayer, createAudioPlayer, NoSubscriberBehavior, getVoiceConnection, AudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice';
import { Collection, Guild, TextBasedChannel, VoiceBasedChannel, time } from 'discord.js';
import { MusicResource } from './MusicResource';
import { FunctionResult } from '../types/FunctionResult';
import { SoundCloudTrack, SpotifyPlaylist, SpotifyTrack, is_expired, refreshToken, search, soundcloud, spotify, validate } from 'play-dl';

export const music: Collection<string,MusicPlayer> = new Collection<string,MusicPlayer>();

export class MusicPlayer {
    private voice_channel: VoiceBasedChannel;
    private text_channel: TextBasedChannel;
    private guild: Guild;
    private player: AudioPlayer;
    private queue: MusicResource[] = [];
    private waiting: boolean = true;
    public repeat: boolean = false;
    public loop: boolean = false;
    private timeoutID: any;

    /**
     * Initialize the MusicPlayer object.
     * @param voice_channel The voice channel the bot needs to join.
     * @param text_channel The text channel the bot will send messages to.
     */
    public constructor(voice_channel: VoiceBasedChannel, text_channel: TextBasedChannel) {
        // Initialize variables and create a connection.
        this.guild = voice_channel.guild;
        this.voice_channel = voice_channel;
        this.text_channel = text_channel;
        
        // Create a player and a connection.
        this.player = this.createPlayer();
        this.connect(this.voice_channel).subscribe(this.player);

        // If everything initialized correctly, add this to the music collection, otherwise destroy this.
        if (this.validate()) music.set(this.guild.id, this);
        else this.destroy();
    }

    /**
     * Connect to a given voice channel and return the VoiceConnection.
     * @param channel The voice channel to connect to.
     * @returns A discord VoiceConnection.
     */
    private connect(channel: VoiceBasedChannel): VoiceConnection {
        const con = joinVoiceChannel({
            channelId: channel.id,
	        guildId: this.guild.id,
	        adapterCreator: this.guild.voiceAdapterCreator,
        });
        con.on('error', e=> {
            console.error(e);
            this.destroy();
        });
        con.on(VoiceConnectionStatus.Disconnected, e => {
            this.destroy();
        });
        return con;
    }

    /**
     * Creates and returns a discord AudioPlayer.
     * @returns A discord AudioPlayer.
     */
    private createPlayer(): AudioPlayer {
        const player:AudioPlayer = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            }
        });
        player.on('error', error => {
            
        });
        player.on(AudioPlayerStatus.Idle, async () => { 
            this.waiting = true; 

            // Handle repeat/loop mode.
            let shifted: MusicResource|undefined = undefined;
            if (!this.repeat) shifted = this.queue.shift();
            if (this.loop) {
                if (shifted instanceof MusicResource) this.queue.push(shifted);
            }
            
            const res = await this.playNext();
            this.sendMessage(res.statusString);
        });
        player.on(AudioPlayerStatus.Playing, () => { this.waiting = false; });
        return player;
    }

    /**
     * Plays the next song if there are any.
     * @returns A FunctionResult representing if playing the next song was successful or not.
     */
    public async playNext(): Promise<FunctionResult> {
        if (this.queue.length === 0) {
            this.timeoutID = setTimeout(() => {
                this.sendMessage("Disconnecting due to innactivity...");
                this.destroy();
            }, 180000);
            return {statusCode: 0, statusString: "There are no more songs in the queue!"};
        }

        // Retrieve the next song and make sure it's ready to play.
        const np = this.queue[0];
        const rtp = await np.readyToPlay();
        if (rtp.statusCode !== 0) return rtp;

        try {
            const ar: AudioResource|null = await np.getResource();
            this.player.play(ar!);
            return {statusCode: 0, statusString: `Now Playing: \`${np.getTitle()}\``};
        } catch (e) {
            this.playNext();
            return {statusCode: 1, statusString: `There was an error playing \`${np.getTitle()}\`!`};
        }
     
    }

    public async addQueue(query: string, userId: string): Promise<FunctionResult> {
        // Determine the query type.
        const type = await validate(query);

        const toQueue: MusicResource[] = [];

        // Make sure spotify token doesn't need a referesh.
        if (is_expired()) {
            console.log("expired");
            await refreshToken();
        }

        // Retrieve the required data from youtube, spotify etc...
        switch(type) {
            case "search":
            case "yt_video":
                //return { statusCode: 1, statusString: "Sorry, youtube support is currently broken!" };
                const yt_search = await search(query, {limit: 1});
                if (yt_search.length < 1) return { statusCode: 1, statusString: "I couldn't find your query!" };
                toQueue.push(
                    new MusicResource(yt_search[0].title!,userId,yt_search[0].durationInSec,yt_search[0].url,false)
                );
                break;
            case "sp_track":
                //return { statusCode: 1, statusString: "Sorry, spotify/youtube support is currently broken!" };
                const sp_track_info = await spotify(query) as SpotifyTrack;
                if (sp_track_info === null) return { statusCode: 1, statusString: "I couldn't find your query!" };
                const sp_yt_search = await search(`${sp_track_info.artists[0].name} - ${sp_track_info.name}`, {limit: 1});
                if (sp_yt_search.length < 1) return { statusCode: 1, statusString: "I couldn't find your query!" };
                toQueue.push(
                    new MusicResource(sp_yt_search[0].title!,userId,sp_yt_search[0].durationInSec,sp_yt_search[0].url,false)
                );
                break;
            case "sp_playlist":
                //return { statusCode: 1, statusString: "Sorry, spotify/youtube support is currently broken!" };
                const sp_playlist_info = await spotify(query) as SpotifyPlaylist;
                (await sp_playlist_info.all_tracks()).forEach(track=> {
                    toQueue.push(new MusicResource(track.artists[0].name + " - " + track.name, userId));
                });
                break;
            case "so_track":
                const so_info = await soundcloud(query) as SoundCloudTrack;
                if (!so_info) return { statusCode: 1, statusString: "I couldn't find your query!" };
                toQueue.push(
                    new MusicResource(so_info.name, userId, so_info.durationInSec, so_info.permalink ,false)
                );
                break;
            default:
                return { statusCode: 1, statusString: "Your query type isn't supported!" };
        }

        // Delete any auto disconnect timeouts.
        if (this.timeoutID !== null) clearTimeout(this.timeoutID);

        // Add all the song(s) to the queue.
        this.queue = this.queue.concat(toQueue);
        
        // If nothing is playing, play the resource, otherwise just leave it in queue.
        if (this.waiting) {
            if (toQueue.length>1) {
                return {
                    statusCode: 0, 
                    statusString: `Added \`${toQueue[0].getTitle()}\` and ${toQueue.length-1} other song(s) to the queue\n`+(await this.playNext()).statusString
                };
            } else return {statusCode: 0, statusString: (await this.playNext()).statusString};
        } else { 
            if (toQueue.length>1) {
                return {statusCode: 0, statusString: `Added \`${toQueue[0].getTitle()}\` and ${toQueue.length-1} other song(s) to the queue to the queue!`};
            } else return {statusCode: 0, statusString: `Added \`${toQueue[0].getTitle()}\` to the queue!`};
        }
    }

    /**
     * Sends a message to the text channel the MusicPlayer is bound to.
     * @param text The message to send.
     */
    private sendMessage(text: string) {
        const channel = this.getTextChannel();
        if (channel !== null) channel.send(text);
    }

    /**
     * Get the channel to send music updates to.
     * @returns The TextBasedChannel to send music updates to.
     */
    private getTextChannel() : TextBasedChannel|null {
        return this.text_channel ? this.text_channel : null;
    }

    /**
     * Set the channel to send music updates to.
     * @param channel The TextBasedChannel to send music updates to.
     */
    public setTextChannel(channel: TextBasedChannel): void {
        this.text_channel = channel;
    }

    /**
     * Get the discord Voice Connection and return it.
     * @returns The VoiceConnection (if it exists).
     */
    private getConnection(): VoiceConnection | undefined {
        const connection = getVoiceConnection(this.guild.id);
        return connection;
    }

    /**
     * Validate that the player and connection exist.
     * @returns True if the connection and player are setup correctly, false otherwise.
     */
    public validate(): boolean {
        if (!this.player) return false;
        if (!this.getConnection()) return false;
        return true;
    }


    /**
     * Register a users vote to skip the current song.
     * @param id The user ID of the user voting to skip.
     * @returns A FunctionResult returning information about the result of this function.
     */
    public voteSkip(id:string): FunctionResult {
        if (this.waiting === true || this.queue.length < 1) return { statusCode: 1, statusString: "I'm not playing anything!" };
        const reqVotes:number = Math.round(
            (this.voice_channel.members.filter(m=>!m.user.bot).size)/2
        );
        if (this.queue[0].getUser() == id) {
            this.player.stop();
            return { statusCode: 0, statusString: "Skipping..." };
        }
        this.queue[0].addVote(id)
        const validVotes = this.voice_channel.members
            .filter(mem=>this.queue[0].getVotes().has(mem.id))
            .map(mem=>mem.id);
        if (validVotes.length >= reqVotes) {
            this.player.stop();
            return { statusCode: 0, statusString: "Skipping..." };
        } else {
            return { statusCode: 0, statusString: `Your vote to skip has been registered. (${validVotes.length}/${reqVotes})` };
        }
    }


    /**
     * Destroy everything and delete this MusicPlayer.
     */
    public destroy(): void {
        if (this.player) this.player.stop(); // If there's a player, stop it.
        const connection = this.getConnection(); // Get the connection (if any).
        connection?.destroy();
        if (music.has(this.guild.id)) music.delete(this.guild.id); // Delete this MusicPlayer.
    }


    /**
     * @returns The current music queue.
     */
    public getQueue(): Array<MusicResource> {
        return this.queue;
    }
}