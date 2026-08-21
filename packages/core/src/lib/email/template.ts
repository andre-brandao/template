// fallow-ignore-file code-duplication
import { Email } from "./index";
import { code, head, preview, render, rule, small, text } from "./render";
import { User } from "../../user";

export namespace Template {
  export async function sendWelcome(userID: string) {
    const user = await User.fromID(userID);
    if (!user?.email) return;

    await Email.send({
      to: user.email,
      subject: "Welcome!",
      ...render([
        preview("You're in — here's how to get started."),
        head(`Hi ${user.name ?? "there"},`),
        text("Welcome! We're glad to have you on board."),
        text(
          "You can now log in and start exploring. If you have any questions, just reply to this email.",
        ),
        rule(),
        small("– The Team"),
      ]),
    });
  }

  export async function sendLoginCode(email: string, otp: string) {
    await Email.send({
      to: email,
      subject: `Your login code: ${otp}`,
      ...render([
        preview(`${otp} — expires shortly`),
        head("Your login code"),
        code(otp),
        text("It expires shortly. If you didn't request it, you can ignore this email."),
        rule(),
        small("– The Team"),
      ]),
    });
  }

  export async function sendProfileUpdated(userID: string) {
    const user = await User.fromID(userID);
    if (!user?.email) return;

    await Email.send({
      to: user.email,
      subject: "Your profile was updated",
      ...render([
        preview("Your profile details changed."),
        head(`Hi ${user.name ?? "there"},`),
        text("Your profile has been updated successfully."),
        text(
          "If you didn't make this change, please contact us immediately by replying to this email.",
        ),
        rule(),
        small("– The Team"),
      ]),
    });
  }
}
