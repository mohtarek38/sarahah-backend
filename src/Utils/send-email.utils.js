import nodemailer from "nodemailer";
import { EventEmitter } from "node:events";
import { Resend } from "resend";

export const emitter = new EventEmitter();

export const sendEmailGmail = async ({ to, subject, content, attachments = [] }) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", //smtp.gmail.com
    port: 465,
    secure: true,
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.USER_EMAIL,
    to,
    subject,
    html: content,
    attachments,
  });
  return info;
};

const sendEmailResend = async ({ to, subject, content, attachments = [] }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const info = await resend.emails.send({
    from: process.env.RESEND_EMAIL_FROM,
    to,
    subject,
    html: content,
    attachments,
  });

  if (info.error) {
    return console.error(info.error);
  }
};
emitter.on("sendEmailResend", async (args) => {
  try {
    await sendEmailResend(args);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
});

emitter.on("sendEmailGmail", async (args) => {
  try {
    await sendEmailGmail(args);
  } catch (error) {
    console.error("Failed to send Gmail:", error);
  }
});