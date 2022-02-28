require('module-alias')('.');



import { Bot, createBotCommand } from '@twurple/easy-bot';
import { authProvider } from '$/lib/auth'
import { getCurrentGame } from '$/lib/api'
import { useDbs, deta } from '$/lib/dbs';
import { useServer } from '$/lib/ws';


const dbs = useDbs(['crasty', 'cdubya719']);
const io = useServer(dbs);


async function main() {
  await Bot.create({
    auth: authProvider,
    channels: Object.keys(dbs),
    prefix: '!',
    commands: [
      createBotCommand('death', async (params, { user, channel, say, msg }) => {
        if (!(
          msg.userInfo.isMod ||
          msg.userInfo.isVip ||
          msg.userInfo.isBroadcaster ||
          msg.userInfo.userId === '79442946'
        )) return;
        const channelName = channel.substring(1);
        const game = await getCurrentGame(channelName);
        if (!dbs[channelName]) dbs[channelName] = deta.Base(channelName);
        const res = await dbs[channelName].get(game.id!);
        const d = parseInt(params[0]) || 1;
        const _d = (res ? res.deaths : 0) as number;
        await dbs[channelName].put({ name: game.name, deaths: (_d + d) }, game.id!)
        io.to(channelName).emit('death_change', await dbs[channelName].get(game.id!))
        // say(`Number of deaths for \'${game.name}\' has been set to ${(d + _d)}.`);
      }),
      createBotCommand('deaths', async (params, { user, channel, say }) => {
				console.log(channel)
        const channelName = channel.substring(1);
        const game = await getCurrentGame(channelName);
        const res = await dbs[channelName].get(game.id!);
        const _d = (res ? res.deaths : 0) as number;
				console.log(_d, game)
				await new Promise(r => setTimeout(r, 1000));
        say(`Number of deaths for \'${game.name}\' is ${_d}.`);
      })
    ]
  });
}

main();