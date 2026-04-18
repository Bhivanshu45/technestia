import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer,{
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
      credentials: true 
    },
  });

  globalThis.__io = io;

  io.on("connection", (socket) => {
    socket.on("joinRoom",({chatRoomId}) => {
      if(!chatRoomId)return;
      socket.join("chat:" + chatRoomId);
    })

    socket.on("leaveRoom",({chatRoomId}) => {
      if(!chatRoomId)return;
      socket.leave("chat:" + chatRoomId);
    })

    socket.on("joinUser",({userId}) => {
      if(!userId)return;
      socket.join("user:" + userId);
    })

    socket.on("leaveUser",({userId}) => {
      if(!userId)return;
      socket.leave("user:" + userId);
    })


  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});