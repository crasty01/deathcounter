import { Server } from "socket.io";
import { getCurrentGame } from '$/lib/api'
import Base from "deta/dist/types/base";
import { env } from "$/lib/env";
import { createServer } from "http";

export const useServer = (dbs: { [key: string]: Base }) => {
  const channels = Object.keys(dbs);
  const httpServer = createServer((req, res) => {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write('<html><body><p>This is home Page.</p></body></html>');
		res.end();
	});
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on("connection", (socket) => {
    socket.on('join', async (data, callback) => {
      if (!channels.includes(data.channel)) {
        callback({ error: 'no such channel', data: null })
        return;
      }
      socket.join(data.channel)
      const game = await getCurrentGame(data.channel)
      callback({ error: null, data: await dbs[data.channel].get(game.id) })
    })
    socket.on('leave', (data) => {
      socket.leave(data.channel)
    })
  });
  httpServer.listen(env.PORT || 4000, () => {
    console.log('created', env.PORT || 4000)
  });

  return io
}