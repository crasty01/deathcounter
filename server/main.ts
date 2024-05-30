import "/services/env.ts";
import Database from "/services/database.ts";
import { Socket } from "/services/websockets.ts";
import { Router } from "/services/router.ts";
import AuthProvider from "/services/auth.ts";
import { useRoutes } from "/routing.ts";
import { Bot, createBotCommand } from "@twurple/easy-bot";
import { generate_messages } from "/helpers.ts";
import { death_handler, deaths_handler } from "/commands.ts";

// INITIALIZATION --------------------------------------
console.log("[INITIALIZATION]");
const database = new Database(Deno.env.get("DATABASE_URL")!);
await database.initialize();

const auth = new AuthProvider(database.sql, {
  client_id: Deno.env.get("TWITCH_CLIENT_ID")!,
  client_secret: Deno.env.get("TWITCH_CLIENT_SECRET")!,
  scope: ["chat:read", "chat:edit"],
});
await auth.initialize();

const user_added = await auth.add_user(Deno.env.get("ADMIN_USER_ID")!);
if (user_added) {
  auth.provider.addIntentsToUser(Deno.env.get("ADMIN_USER_ID")!, ["chat"]);
}

// SOCKETS ---------------------------------------------
console.log("[SOCKETS]");
const socket = new Socket({ database });

// BOT -------------------------------------------------
console.log("[BOT]");
const channel_list = database.channel_list.map((e) => e.channel_name);
const bot = new Bot({
  authProvider: auth.provider,
  prefix: "!",
  channels: channel_list.length > 0
    ? channel_list
    : [Deno.env.get("ADMIN_CHANNEL")!],
  commands: [
    createBotCommand("death", (params, context) => {
      death_handler({ params, context, bot, database, socket });
    }),
    createBotCommand("deaths", (params, context) => {
      deaths_handler({ params, context, bot, database, socket });
    }),
  ],
});

await Promise.allSettled(
  database.channel_list.map(({ channel_name }) =>
    new Promise((resolve, reject) => {
      bot.join(channel_name).then(() => {
        bot.say(channel_name, generate_messages.online()).then(resolve).catch(
          reject,
        );
      }).catch(reject);
    })
  ),
);

// ROUTER ----------------------------------------------
console.log("[ROUTER]");
const router = new Router();
useRoutes({ router, database, auth, bot });

// SERVER ----------------------------------------------
console.log("[SERVER]");
const PORT = parseInt(Deno.env.get("PORT") ?? "8000");
const SOCKET_PATTERN = new URLPattern({ pathname: "/:channel_id" });

Deno.serve({
  port: PORT,
}, (req) => {
  const match = SOCKET_PATTERN.exec(req.url);
  const channel_id = match?.pathname.groups.channel_id ?? null;
  const is_websocket = req.headers.get("upgrade") === "websocket";

  console.log(is_websocket, channel_id);
  if (!is_websocket || !channel_id) {
    return router.route(req);
  } else {
    return socket.use(req, channel_id); // TODO: fix
  }
});
