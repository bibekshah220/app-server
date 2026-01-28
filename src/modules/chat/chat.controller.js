const Chat = require("./chat.model");
const Message = require("./message.model");
const Product = require("../products/product.model");

exports.accessChat = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID required" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const sellerUserId =
      product.seller.user?._id ||
      (await require("../sellers/seller.model").findById(product.seller)).user;

    // Check if chat exists
    let isChat = await Chat.findOne({
      product: productId,
      participants: { $all: [req.user._id, sellerUserId] },
    })
      .populate("participants", "name email avatar")
      .populate("product", "name images price");

    if (isChat) {
      res.send(isChat);
    } else {
      const chatData = {
        participants: [req.user._id, sellerUserId],
        product: productId,
        unreadCounts: {
          [req.user._id]: 0,
          [sellerUserId]: 0,
        },
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id)
        .populate("participants", "name email avatar")
        .populate("product", "name images price");

      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.fetchChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } },
    })
      .populate("participants", "name email avatar")
      .populate("product", "name images price")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name avatar")
      .sort({ createdAt: 1 }); // Oldest first

    res.status(200).json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
