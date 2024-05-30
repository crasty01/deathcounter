import env from "/services/env.ts";
import { generate_messages } from "/helpers.ts";
import { ChannelTableRow, CommandHandler, GameTableRow } from "/types.ts";


export const death_handler: CommandHandler = async ({ bot, database, params, context, socket }) => {
	const userInfo = context.msg.userInfo;
	if (!(
		userInfo.isMod ||
		userInfo.isVip ||
		userInfo.isBroadcaster ||
		userInfo.userId === env.ADMIN_USER_ID
	)) return;

	const channel_info = await bot.api.channels.getChannelInfoById(context.broadcasterId);
	if (!(true
		&& channel_info
		&& channel_info.gameId
		&& channel_info.gameName
	)) {
		await bot.say(context.broadcasterName, generate_messages.no_game_found());
		return;
	}

	const death_modifier = parseInt(params[0]) || 1;
	const channel: ChannelTableRow = {
		channel_id: channel_info.id,
		channel_name: channel_info.name,
	}
	const game: GameTableRow = {
		game_id: channel_info.gameId,
		game_name: channel_info.gameName,
	};
	
	const death = await database.createOrUpdateDeath(channel, game, death_modifier);
	socket.channels.get(death.channel_id)?.send(JSON.stringify({
		type: 'death_update',
		value: {
			...channel,
			...game,
			deaths: death.deaths,
		}
	}));
	// TODO: broadcast to websocket
}

export const deaths_handler: CommandHandler = async ({ bot, database, context }) => {
	const channel_info = await bot.api.channels.getChannelInfoById(context.broadcasterId);

	if (!(true
		&& channel_info
		&& channel_info.gameId
		&& channel_info.gameName
	)) {
		await bot.say(context.broadcasterName, generate_messages.no_game_found());
		return;
	}

	const death = database.deaths.get(channel_info?.id)?.get(channel_info?.gameId!);
	if (!death || death.deaths === 0) {
		await bot.say(channel_info.name, generate_messages.no_deaths(
			channel_info.displayName,
			channel_info.gameName,
		));
	} else {
		await bot.say(channel_info.name, generate_messages.deaths(
			channel_info.displayName,
			channel_info.gameName,
			death.deaths,
		));
	}
}