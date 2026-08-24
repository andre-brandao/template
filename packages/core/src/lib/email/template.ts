// fallow-ignore-file code-duplication
import { Email } from "./index";
import { code, head, preview, render, rule, small, text } from "./render";
import { User } from "../../user";

/**
 * `Render` builds a mail, `Send` addresses one. Rendering takes no IO, so a mail can be read
 * without a driver.
 */
export namespace Template {
  export namespace Render {
    export function welcome(name: string) {
      return {
        subject: "Welcome!",
        ...render([
          preview("You're in — here's how to get started."),
          head(`Hi ${name},`),
          text("Welcome! We're glad to have you on board."),
          text(
            "You can now log in and start exploring. If you have any questions, just reply to this email.",
          ),
          rule(),
          small("– The Team"),
        ]),
      };
    }

    export function loginCode(otp: string) {
      return {
        subject: `Your login code: ${otp}`,
        ...render([
          preview(`${otp} — expires shortly`),
          head("Your login code"),
          code(otp),
          text("It expires shortly. If you didn't request it, you can ignore this email."),
          rule(),
          small("– The Team"),
        ]),
      };
    }

    export function profileUpdated(name: string) {
      return {
        subject: "Your profile was updated",
        ...render([
          preview("Your profile details changed."),
          head(`Hi ${name},`),
          text("Your profile has been updated successfully."),
          text(
            "If you didn't make this change, please contact us immediately by replying to this email.",
          ),
          rule(),
          small("– The Team"),
        ]),
      };
    }
  }

  export namespace Send {
    export async function welcome(userID: string) {
      const user = await User.fromID(userID);
      if (!user?.email) return;

      await Email.send({ to: user.email, ...Render.welcome(user.name ?? "there") });
    }

    export async function loginCode(email: string, otp: string) {
      await Email.send({ to: email, ...Render.loginCode(otp) });
    }

    export async function updated(userID: string) {
      const user = await User.fromID(userID);
      if (!user?.email) return;

      await Email.send({ to: user.email, ...Render.profileUpdated(user.name ?? "there") });
    }
  }

  // === DEV ===

  /**
   * Not used in production. Every template paired with props to stand it up, so the preview at
   * /dev/mail can enumerate them — add a mail, add a row, and it shows up there.
   */
  export const _list = [
    {
      name: "welcome",
      label: "Welcome",
      blurb: "Sent once, the first time an account appears.",
      render: () => Render.welcome("Ada"),
    },
    {
      name: "login",
      label: "Login code",
      blurb: "The six-digit code behind passwordless sign-in.",
      render: () => Render.loginCode("482913"),
    },
    {
      name: "updated",
      label: "Profile updated",
      blurb: "Confirms a change the user just made.",
      render: () => Render.profileUpdated("Ada"),
    },
  ];
}
