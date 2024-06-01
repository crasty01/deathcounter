import { Bot } from "@twurple/easy-bot";
import AuthProvider from "/services/auth.ts";
import Database from "/services/database.ts";
import { Router } from "/services/router.ts";
import { ChannelTableRow } from "/types.ts";
import { generate_messages } from "/helpers.ts";

export const useRoutes = ({ router, database, auth, bot }: {
  router: Router;
  database: Database;
  auth: AuthProvider;
  bot: Bot;
}) => {
  router.get("/", async () => {
    return new Response("Hello, World", { status: 200 });
  });

  router.get("/search/channel", async (request) => {
    const url = new URL(request.url);
    const search = new URLSearchParams(url.search);
    const channel_id = search.has("channel_id")
      ? decodeURIComponent(search.get("channel_id")!)
      : null;
    const channel_name = search.has("channel_name")
      ? decodeURIComponent(search.get("channel_name")!)
      : null;
    console.log({ url, search, channel_id, channel_name });

    if (channel_id === null && channel_name === null) {
      return new Response("no channel_id or channel_name", { status: 401 });
    }

    let channel: ChannelTableRow | undefined;

    if (channel_id) {
      console.log("searching by channel_id:", channel_id);
      channel = await database.getChannelById(channel_id);
    }
    if (!channel && channel_name) {
      channel = await database.getChannelByName(channel_name.toLowerCase());
    }

    if (channel) {
      return new Response(JSON.stringify(channel), { status: 200 });
    } else {
      return new Response("no channel found", { status: 404 });
    }
  });

  router.get("/search/game", async (request) => {
    const url = new URL(request.url);
    const search = new URLSearchParams(url.search);
    const game_id = search.has("game_id")
      ? decodeURIComponent(search.get("game_id")!)
      : null;

    if (game_id === null) {
      return new Response("no game_id", { status: 401 });
    }

    const game = await database.getGameById(decodeURIComponent(game_id));

    if (game) {
      return new Response(JSON.stringify(game), { status: 200 });
    } else {
      return new Response("no channel found", { status: 404 });
    }
  });

  router.get("/channel/:channel_name", async (_, params) => {
    const channel_name = params.channel_name;
    let channel = database.channel_list.find((channel) =>
      channel.channel_name === channel_name
    );

    const user_info = await bot.api.users.getUserByName(channel_name);
    if (!user_info) throw new Error("no user found");

    const channel_info = await bot.api.channels.getChannelInfoById(
      user_info.id,
    );
    if (!channel_info) throw new Error("no channel found");

    if (!channel) {
      await bot.join(channel_name);
      await bot.say(channel_name, generate_messages.join());
      await database.createOrUpdateDeath({
        channel_id: channel_info.id,
        channel_name: channel_info.name,
      }, {
        game_id: channel_info.gameId,
        game_name: channel_info.gameName,
      }, 0);

      channel = database.channels.get(channel_info.id);
    }

    const deaths = database.deaths.get(channel_info.id)?.get(
      channel_info.gameId,
    );

    return new Response(
      JSON.stringify({
        channel_id: channel_info.id,
        channel_name: channel_info.name,
        channel_display_name: channel_info.displayName,
        game_id: channel_info.gameId,
        game_name: channel_info.gameName,
        deaths: deaths?.deaths,
      }),
      { status: 200 },
    );
  });

  router.get("/auth/initialize", async () => {
    if (auth.provider.hasUser(Deno.env.get("ADMIN_USER_ID")!)) {
      return new Response("user alrady exists", { status: 401 });
    }

    const url = new URL("https://id.twitch.tv/oauth2/authorize");
    const params = new URLSearchParams({
      client_id: Deno.env.get("TWITCH_CLIENT_ID")!,
      redirect_uri: new URL("/auth/callback", Deno.env.get("SERVER_URL")!)
        .toString(),
      response_type: "code",
      scope: "chat:read chat:edit",
    });

    return Response.redirect(`${url.origin}${url.pathname}?${params}`);
  });

  router.get("/auth/callback", async (request) => {
    if (auth.provider.hasUser(Deno.env.get("ADMIN_USER_ID")!)) {
      return new Response("user alrady exists", { status: 401 });
    }

    const code = new URLSearchParams((new URL(request.url)).search).get("code");

    if (code === null) {
      return new Response("no code provided", { status: 401 });
    }

    const url = new URL("https://id.twitch.tv/oauth2/token");
    const params = new URLSearchParams({
      client_id: Deno.env.get("TWITCH_CLIENT_ID")!,
      client_secret: Deno.env.get("TWITCH_CLIENT_SECRET")!,
      grant_type: "authorization_code",
      redirect_uri: new URL("/auth/callback", Deno.env.get("SERVER_URL")!)
        .toString(),
      code,
    });

    const res = await fetch(`${url.origin}${url.pathname}?${params}`, {
      method: "POST",
    });
    const token: {
      access_token: string;
      expires_in: number;
      refresh_token: string;
      scope: Array<string>;
      token_type: string;
    } = await res.json();

    if (token) {
      await auth.add_user_for_token({
        accessToken: token.access_token,
        expiresIn: token.expires_in,
        obtainmentTimestamp: Date.now(),
        refreshToken: token.refresh_token,
        scope: token.scope,
      });
      auth.provider.addIntentsToUser(Deno.env.get("ADMIN_USER_ID")!, ["chat"]);
      return new Response("ok", { status: 200 });
    } else {
      return new Response("no token recieved", { status: 500 });
    }
  });

  router.get("/channel", async () => {
    const channels = database.channel_list;
    return new Response(JSON.stringify(channels), { status: 200 });
  });

  router.get("/game", async () => {
    const channels = database.game_list;
    return new Response(JSON.stringify(channels), { status: 200 });
  });

  // router.get('/clear', async () => {
  // 	await Promise.all([
  // 		database.sql`drop table access_tokens`,
  // 		database.sql`drop table deaths`,
  // 		database.sql`drop table channels`,
  // 		database.sql`drop table games`,
  // 	]);

  // 	return new Response('ok', { status: 200 });
  // })

  router.get("/*", async () => {
    return new Response("page not found", { status: 404 });
  });
};
