const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Chat = require("./chat.model");
const Message = require("./message.model");
const User = require("../auth/user.model");

let io;

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware for Auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Join a Chat Room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User ${socket.user._id} joined chat ${chatId}`);
    });

    // Send Message
    socket.on("send_message", async (data) => {
      try {
        const { chatId, content, type = "text" } = data;

        // Save to DB
        const message = await Message.create({
          chat: chatId,
          sender: socket.user._id,
          content,
          type,
          readBy: [socket.user._id],
        });

        // Update Chat (Last Message)
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: {
            content: type === "image" ? "Sent an image" : content,
            sender: socket.user._id,
            timestamp: new Date(),
          },
          $inc: {
            [`unreadCounts.${getOtherParticipantId(chatId, socket.user._id)}`]: 1,
          }, // Logic needed here
        });

        // Emit to Room
        io.to(chatId).emit(
          "receive_message",
          await message.populate("sender", "name avatar"),
        );
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};

module.exports = { initSocket, getIo: () => io };
