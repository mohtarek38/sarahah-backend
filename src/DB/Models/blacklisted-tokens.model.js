import mongoose from "mongoose";
const blackListedTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
    },
    expirationDate: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to auto-delete expired tokens
    },
  },
  {
    timestamps: true,
  }
);
const BlackListedTokens = mongoose.model("BlacklistToken", blackListedTokenSchema);
export default BlackListedTokens;
