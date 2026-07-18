// fallow-ignore-file code-duplication
import { Email } from "./index";
import { User } from "../user";

export namespace Template {
  export async function sendWelcome(userID: string) {
    const user = await User.fromID(userID);
    if (!user?.email) return;

    const body = [
      `Hi ${user.name ?? "there"},`,
      ``,
      `Welcome! We're glad to have you on board.`,
      ``,
      `You can now log in and start exploring. If you have any questions, just reply to this email.`,
      ``,
      `– The Team`,
    ].join("\n");

    await Email.send({ to: user.email, subject: "Welcome!", body });
  }

  export async function sendLoginCode(email: string, code: string) {
    const body = [
      `Your login code is ${code}.`,
      ``,
      `It expires shortly. If you didn't request it, you can ignore this email.`,
      ``,
      `– The Team`,
    ].join("\n");

    await Email.send({ to: email, subject: `Your login code: ${code}`, body });
  }

  export async function sendProfileUpdated(userID: string) {
    const user = await User.fromID(userID);
    if (!user?.email) return;

    const body = [
      `Hi ${user.name ?? "there"},`,
      ``,
      `Your profile has been updated successfully.`,
      ``,
      `If you didn't make this change, please contact us immediately by replying to this email.`,
      ``,
      `– The Team`,
    ].join("\n");

    await Email.send({ to: user.email, subject: "Your profile was updated", body });
  }
}
