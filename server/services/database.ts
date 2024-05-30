import postgres, { type Sql } from 'postgres';
import { ChannelTableRow, ChannelWithDeaths, DeathTableRow, GameTableRow } from '/types.ts';

export default class Database {
	#sql: Sql;
	#channels: Map<string, ChannelTableRow>;
	#games: Map<string, GameTableRow>;
	#deaths: Map<string, Map<string, DeathTableRow>>;

	constructor(url: string) {
		console.log(url);
		this.#sql = postgres(url, {
			debug: false,
			onnotice: (notice) => {
				console.log(notice.message);
			},
		});
		this.#channels = new Map();
		this.#games = new Map();
		this.#deaths = new Map();
	}

	get sql() {
		return this.#sql;
	}

	get channel_list() {
		return [...(this.#channels.values() ?? [])]
	}

	get game_list() {
		return [...(this.#games.values() ?? [])]
	}

	get death_list() {
		const deaths: Array<DeathTableRow> = [];

		for (const [_, games] of this.#deaths) {
			for (const [_, death] of games) {
				deaths.push(death);
			}
		}

		return deaths;
	}

	get channels() {
		return this.#channels
	}

	get games() {
		return this.#games
	}

	get deaths() {
		return this.#deaths;
	}

	async initialize() {
		try {
			await this.#sql`
				create table if not exists channels (
					channel_id text primary key,
					channel_name text not null
				);`;
	
			await this.#sql`
				create table if not exists games (
					game_id text primary key,
					game_name text not null
				);`;
	
			await this.#sql`
				create table if not exists deaths (
					channel_id text not null,
					game_id text not null,
					deaths integer not null default 0,
					primary key (channel_id, game_id),
					foreign key (channel_id) references channels(channel_id),
					foreign key (game_id) references games(game_id)
				);`;

			await this.#sql`create index if not exists idx_channel_id on deaths (channel_id);`;
			await this.#sql`create index if not exists idx_game_id on deaths (game_id);`;

			const channel_rows = await this.#sql<Array<ChannelTableRow>>`select * from channels`;
			const game_rows = await this.#sql<Array<GameTableRow>>`select * from games`;
			const deaths_rows = await this.#sql<Array<DeathTableRow>>`select * from deaths`;

			for (const channel of channel_rows) {
				if (!this.#channels.has(channel.channel_id)) {
					this.#channels.set(channel.channel_id, channel);
				}
			}

			for (const game of game_rows) {
				if (!this.#games.has(game.game_id)) {
					this.#games.set(game.game_id, game);
				}
			}

			for (const deaths of deaths_rows) {
				if (!this.#deaths.has(deaths.channel_id)) {
					this.#deaths.set(deaths.channel_id, new Map());
				}
				if (!this.#deaths.get(deaths.channel_id)!.has(deaths.game_id)) {
					this.#deaths.get(deaths.channel_id)?.set(deaths.game_id, deaths);
				}
			}

		} catch (error) {
			console.error("Error while creating tables:", error);
		}
	}

	async createChannel(channel: ChannelTableRow) {
		if (this.#channels.has(channel.channel_id)) {
			return this.#channels.get(channel.channel_id)!;
		}
		const [database_channel] = await this.#sql<[ChannelTableRow]>`insert into channels ${ this.#sql(channel) } returning *`;
		this.#channels.set(channel.channel_id, channel);

		return database_channel;
	}

	async createGame(game: GameTableRow) {
		if (this.#games.has(game.game_id)) {
			return this.#games.get(game.game_id)!;
		}
		const [database_game] = await this.#sql<[GameTableRow]>`insert into games ${ this.#sql(game) } returning *`;
		this.#games.set(game.game_id, game);

		return database_game;
	}

	async createDeath(death: DeathTableRow) {
		if (true
			&& this.#deaths.has(death.channel_id)
			&& this.#deaths.get(death.channel_id)!.has(death.game_id)
		) {
			return this.#deaths.get(death.channel_id)!.get(death.game_id)!;
		}
		const [database_death] = await this.#sql<[DeathTableRow]>`insert into deaths ${ this.#sql(death) } returning *`;
		if (!this.#deaths.has(death.channel_id)) this.#deaths.set(death.channel_id, new Map());
		this.#deaths.get(death.channel_id)?.set(death.game_id, database_death);

		return database_death;
	}

	async updateDeath(channel: ChannelTableRow, game: GameTableRow, n: number) {
		if (typeof n !== 'number') throw new Error("death increase is not a number");
		
		const [database_death] = await this.#sql<[DeathTableRow]>`update deaths set deaths = deaths + ${ n } where channel_id = ${ channel.channel_id } and game_id = ${ game.game_id } returning *`;
		this.#deaths.get(channel.channel_id)!.set(game.game_id, {
			channel_id: channel.channel_id,
			game_id: game.game_id,
			deaths: database_death.deaths,
		});
		return database_death;
	}

	async createOrUpdateDeath(channel: ChannelTableRow, game: GameTableRow, n = 1) {
		await Promise.all([
			this.createChannel(channel),
			this.createGame(game),
		]);

		const death_created = await this.createDeath({
			channel_id: channel.channel_id,
			game_id: game.game_id,
			deaths: 0,
		});

		if (n === 0) {
			return death_created;
		} else {
			return await this.updateDeath(channel, game, n);
		}
	}

	async getChannelById(channel_id: string, omit_deaths = true) {
		let channel: (typeof omit_deaths extends true ? ChannelTableRow : ChannelWithDeaths) | undefined;
		if (omit_deaths) {
			[channel] = await this.#sql<[ChannelWithDeaths?]>`select * from channels where channel_id = ${ channel_id }`;
		} else {
			[channel] = await this.#sql<[ChannelWithDeaths?]>`select 
				channels.channel_id, 
				channels.channel_name, 
				json_agg(json_build_object(
					'game_id', deaths.game_id, 
					'game_name', games.game_name, 
					'deaths', deaths.deaths
				)) as deaths
			from channels
			left join deaths on channels.channel_id = deaths.channel_id
			left join games on deaths.game_id = games.game_id
			where channels.channel_id = ${ channel_id }
			group by channels.channel_id, channels.channel_name, games.game_name;`;
		}

		console.log(channel)
		return channel;
	}

	async getChannelByName(channel_name: string, omit_deaths = true) {
		let channel: (typeof omit_deaths extends true ? ChannelTableRow : ChannelWithDeaths) | undefined;
		if (omit_deaths) {
			[channel] =  await this.#sql<[ChannelWithDeaths?]>`select * from channels where channel_name = ${ channel_name }`;
		} else {
			[channel] = await this.#sql<[ChannelWithDeaths?]>`select 
				channels.channel_id, 
				channels.channel_name, 
				json_agg(json_build_object(
					'game_id', deaths.game_id, 
					'game_name', games.game_name, 
					'deaths', deaths.deaths
				)) as deaths
			from channels
			left join deaths on channels.channel_id = deaths.channel_id
			left join games on deaths.game_id = games.game_id
			where channels.channel_name = ${ channel_name }
			group by channels.channel_id, channels.channel_name, games.game_name;`;
		}
		return channel;
	}

	async getGameById(game_id: string) {
		return (await this.#sql<[GameTableRow?]>`select * from games where game_id = ${ game_id }`)?.[0]
	}
}