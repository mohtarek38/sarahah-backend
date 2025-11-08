import { Router } from "express";

import * as messageServices from "./Services/message.services.js";
import { messageSchema } from "../../Validators/Schemas/message.schema.js";
import { authenticationMiddleware, validationMiddleware } from "../../Middlewares/middlewares.barrel.js";
import { sendMessageLimiter } from "../../Utils/rate-limiter.utils.js";

const router = Router();
router.get("/", (req, res) => {
  res.send("Message Controller is working");
});
router.get("/inbox", authenticationMiddleware, messageServices.getMessagesService);
router.get("/public/:userId", messageServices.getPublicMessagesService);
router.patch("/toggle-visibility/:messageId", authenticationMiddleware, messageServices.toggleMessageVisibilityService);
router.delete("/delete/:messageId", authenticationMiddleware, messageServices.deleteMessageService);
router.post("/send/:recieverId", sendMessageLimiter, validationMiddleware(messageSchema), messageServices.sendMessageService);

export const messageController = router;
