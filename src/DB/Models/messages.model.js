import mongoose from "mongoose";
import { maxMessageLength } from "../../Commons/constants/message.constants.js";
const messageSchema = new mongoose.Schema(
  {
    recieverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hidden: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: maxMessageLength,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
messageSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});
messageSchema.statics.softDelete = function (id) {
  return this.findByIdAndUpdate(id, { isDeleted: true });
};
const Message = mongoose.model("Message", messageSchema);
export default Message;
