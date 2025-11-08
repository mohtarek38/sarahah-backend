import Joi from "joi";
import { maxMessageLength } from "../../Commons/constants/message.constants.js";

export const messageSchema = {
  params: Joi.object({ recieverId: Joi.string().hex().length(24).required() }),
  body: Joi.object({ content: Joi.string().max(maxMessageLength).required() }),
};
