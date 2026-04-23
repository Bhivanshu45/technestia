import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer,{
    cors: {
      origin:
        process.env.SOCKET_CORS_ORIGIN ||
        process.env.RENDER_EXTERNAL_URL ||
        process.env.NEXT_PUBLIC_SOCKET_URL ||
        "http://localhost:3000",
      credentials: true 
    },
  });

  globalThis.__io = io;

  const presenceRoomName = (chatRoomId) => `presence:chat:${chatRoomId}`;

  const normalizeUserIds = (userIds) => {
    if (!Array.isArray(userIds)) return [];
    const normalized = userIds
      .map((userId) => Number(userId))
      .filter((userId) => Number.isFinite(userId) && userId > 0);
    return Array.from(new Set(normalized));
  };

  const getPresenceSubscriptions = (socket) => {
    if (!socket.data.presenceSubscriptions) {
      socket.data.presenceSubscriptions = {};
    }
    return socket.data.presenceSubscriptions;
  };

  const collectWatchedUserIds = async (chatRoomId) => {
    const socketsInPresenceRoom = await io.in(presenceRoomName(chatRoomId)).fetchSockets();
    const watchedUserIds = new Set();

    for (const subscribedSocket of socketsInPresenceRoom) {
      const subscriptions = subscribedSocket.data.presenceSubscriptions;
      const roomUserIds = subscriptions?.[chatRoomId];
      if (!Array.isArray(roomUserIds)) continue;
      for (const userId of roomUserIds) {
        watchedUserIds.add(userId);
      }
    }

    return Array.from(watchedUserIds);
  };

  const computeOnlineUserIds = async (userIds) => {
    const onlineUserIds = [];

    await Promise.all(
      userIds.map(async (userId) => {
        const sockets = await io.in("user:" + userId).fetchSockets();
        if (sockets.length > 0) {
          onlineUserIds.push(userId);
        }
      }),
    );

    return onlineUserIds;
  };

  const emitPresenceStateForChatRoom = async (chatRoomId) => {
    const watchedUserIds = await collectWatchedUserIds(chatRoomId);
    const onlineUserIds = await computeOnlineUserIds(watchedUserIds);

    io.to(presenceRoomName(chatRoomId)).emit("chat:presence:state", {
      chatRoomId,
      onlineUserIds,
    });
  };

  const emitPresenceStateForSubscribedRoomsByUser = async (userId) => {
    const allSockets = await io.fetchSockets();
    const impactedChatRoomIds = new Set();

    for (const connectedSocket of allSockets) {
      const subscriptions = connectedSocket.data.presenceSubscriptions;
      if (!subscriptions) continue;

      for (const [chatRoomId, roomUserIds] of Object.entries(subscriptions)) {
        if (!Array.isArray(roomUserIds)) continue;
        if (roomUserIds.includes(userId)) {
          impactedChatRoomIds.add(Number(chatRoomId));
        }
      }
    }

    await Promise.all(
      Array.from(impactedChatRoomIds).map((chatRoomId) =>
        emitPresenceStateForChatRoom(chatRoomId),
      ),
    );
  };

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
      const normalizedUserId = Number(userId);
      if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) return;
      socket.data.userId = normalizedUserId;
      socket.join("user:" + normalizedUserId);
      emitPresenceStateForSubscribedRoomsByUser(normalizedUserId);
    })

    socket.on("leaveUser",({userId}) => {
      if(!userId)return;
      const normalizedUserId = Number(userId);
      if (!Number.isFinite(normalizedUserId) || normalizedUserId <= 0) return;
      socket.leave("user:" + normalizedUserId);
      emitPresenceStateForSubscribedRoomsByUser(normalizedUserId);
    })

    socket.on("chat:presence:subscribe", async ({ chatRoomId, userIds }) => {
      const normalizedChatRoomId = Number(chatRoomId);
      if (!Number.isFinite(normalizedChatRoomId) || normalizedChatRoomId <= 0) return;

      const normalizedUserIds = normalizeUserIds(userIds);
      const subscriptions = getPresenceSubscriptions(socket);
      subscriptions[normalizedChatRoomId] = normalizedUserIds;

      socket.join(presenceRoomName(normalizedChatRoomId));
      await emitPresenceStateForChatRoom(normalizedChatRoomId);
    });

    socket.on("chat:presence:unsubscribe", ({ chatRoomId }) => {
      const normalizedChatRoomId = Number(chatRoomId);
      if (!Number.isFinite(normalizedChatRoomId) || normalizedChatRoomId <= 0) return;

      const subscriptions = getPresenceSubscriptions(socket);
      delete subscriptions[normalizedChatRoomId];
      socket.leave(presenceRoomName(normalizedChatRoomId));
    });

    socket.on("chat:typing:start",({ chatRoomId, userId, userName }) => {
      if(!chatRoomId || !userId) return;
      socket.to("chat:" + chatRoomId).emit("chat:typing:start", {
        chatRoomId,
        userId,
        userName: userName || null,
      });
    })

    socket.on("chat:typing:stop",({ chatRoomId, userId }) => {
      if(!chatRoomId || !userId) return;
      socket.to("chat:" + chatRoomId).emit("chat:typing:stop", {
        chatRoomId,
        userId,
      });
    })

    socket.on("chat:message:seen", ({ chatRoomId, userId, messageId, seenAt, userName }) => {
      if (!chatRoomId || !userId || !messageId || !seenAt) return;
      io.to("chat:" + chatRoomId).emit("chat:message:seen", {
        chatRoomId,
        userId,
        messageId,
        seenAt,
        userName: userName || null,
      });
    });

    socket.on("disconnect", () => {
      const disconnectedUserId = Number(socket.data.userId);
      if (!Number.isFinite(disconnectedUserId) || disconnectedUserId <= 0) return;
      emitPresenceStateForSubscribedRoomsByUser(disconnectedUserId);
    });


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