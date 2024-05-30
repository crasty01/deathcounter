export const generate_messages = {
  join: () =>
    "MrDestructoid Greetings, mortals! Grim Reaper Bot here, ready to chronicle all comedic demises!",
  online: () => "MrDestructoid Grim Reaper Bot is alive once again",
  no_game_found: () => "PoroSad could not find the game",
  no_deaths: (
    channel_name: string,
    game_name: string,
  ) => `${channel_name} has no recorded deaths for '${game_name}'`,
  deaths: (
    channel_name: string,
    game_name: string,
    deaths: number,
  ) =>
    `${channel_name} has died ${deaths} time${
      deaths === 1 ? "" : "s"
    } playing '${game_name ?? "unknown"}'`,
} as const;

// export const get_current_game = (bot: Bot, channel_id: string) => {
// 	return b
// }
