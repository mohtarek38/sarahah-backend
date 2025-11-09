import Message from "../../../DB/Models/messages.model.js";
import User from "../../../DB/Models/users.model.js";
import mongoose from "mongoose";


// Protected services (require authentication)
export const getMessagesService = async (req, res) => {
  try {
    const { _id: userId } = req.loggedInUser.user;
    const recievedMessages = await Message.find({ recieverId: userId })
      .select("recieverId content createdAt hidden")
      .sort({ createdAt: -1 })
      .lean();
    if (recievedMessages.length === 0) {
      return res.status(200).json({ message: "No messages found" });
    }
    return res.status(200).json({ message: "Messages fetched successfully", data: recievedMessages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const toggleMessageVisibilityService = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId).select("recieverId content createdAt hidden");
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    message.hidden = !message.hidden;
    await message.save();
    return res.status(200).json({ message: "Message visibility toggled successfully", message });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const deleteMessageService = async (req, res) => {
  try {
    const { messageId } = req.params;
    const deletedMessage = await Message.softDelete(messageId);
    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Public services (no authentication required)
export const sendMessageService = async (req, res) => {
  try {
    const { content } = req.body;
    const { recieverId } = req.params;
    const isRecieverExist = await User.findById(recieverId);
    if (!isRecieverExist || !mongoose.isValidObjectId(recieverId)) {
      return res.status(404).json({ message: "Reciever not found" });
    }
    const newMessage = await Message.create({
      content,
      recieverId,
    });
    return res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getPublicMessagesService = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }
    const publicMessages = await Message.find({ recieverId: userId, hidden: false })
      .select("recieverId content createdAt")
      .sort({ createdAt: -1 })
      .lean();
    if (publicMessages.length === 0) {
      return res.status(200).json({ message: "No public messages found" });
    }
    return res.status(200).json({ message: "Public messages fetched successfully", data: publicMessages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
