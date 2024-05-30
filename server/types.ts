import type { Bot, BotCommandContext } from "@twurple/easy-bot";
import type Database from "/services/database.ts";
import type { Socket } from "./services/websockets.ts";

export type Prettify<T> =
  & {
    [K in keyof T]: Prettify<T[K]>;
  }
  & {};

export type ChannelTableRow = {
  channel_id: string;
  channel_name: string;
  // ...
};

export type GameTableRow = {
  game_id: string;
  game_name: string;
  // ...
};

export type DeathTableRow = {
  channel_id: string;
  game_id: string;
  deaths: number;
};

export type ChannelWithDeaths = Prettify<
  ChannelTableRow & {
    deaths: Array<Omit<DeathTableRow & { game_name: string }, "channel_id">>;
  }
>;

export type AuthProviderOptions = {
  client_id: string;
  client_secret: string;
  scope: Array<string>;
};

export type AccessTokenTableRow = {
  user_id: string;
  access_token: string;
  refresh_token: string;
  scope: Array<string>;
  expires_in: number | null;
  obtainment_timestamp: number;
};

export type CommandHandler = (
  options: {
    params: Array<string>;
    context: BotCommandContext;
    bot: Bot;
    database: Database;
    socket: Socket;
  },
) => void | Promise<void>;
