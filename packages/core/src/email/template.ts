// fallow-ignore-file code-duplication
import { Email } from "./index";
import { User } from "../user";
import { Actor } from "../actor";
import { Insights } from "../todo/insights";

export namespace Template {
  const esc = (text: string) =>
    text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

  /** Weekly todo summary for the current actor. Skips users without email or with nothing to report. */
  export async function sendWeeklyInsights(range: Insights.Range) {
    const user = await User.fromID(Actor.userID());
    if (!user?.email) return "missing" as const;
    const [stats, activity, due] = await Promise.all([
      Insights.stats(range),
      Insights.activity(range),
      Insights.due(),
    ] as const);
    if (!activity.active && stats.overdue === 0) return "empty" as const;
    const done = activity.series.reduce((sum, point) => sum + point.completed, 0);

    const upcoming = due.map(
      (todo) => `${todo.title}${todo.dueDate ? ` (due ${todo.dueDate.slice(0, 10)})` : ""}`,
    );

    const body = [
      `Hi ${user.name ?? "there"},`,
      ``,
      `Here's your week (${range.start} – ${range.end}):`,
      ``,
      `• Created: ${stats.total}`,
      `• Completed: ${done}`,
      `• Still open: ${stats.open}`,
      `• Overdue: ${stats.overdue}`,
      ...(upcoming.length ? [``, `Coming up:`, ...upcoming.map((line) => `• ${line}`)] : []),
      ``,
      `– The Team`,
    ].join("\n");

    const html = [
      `<h2>Your week in todos</h2>`,
      `<p>${range.start} – ${range.end}</p>`,
      `<ul>`,
      `<li>Created: ${stats.total}</li>`,
      `<li>Completed: ${done}</li>`,
      `<li>Still open: ${stats.open}</li>`,
      `<li>Overdue: ${stats.overdue}</li>`,
      `</ul>`,
      ...(upcoming.length
        ? [`<h3>Coming up</h3>`, `<ul>`, ...upcoming.map((line) => `<li>${esc(line)}</li>`), `</ul>`]
        : []),
    ].join("\n");

    await Email.send({
      to: user.email,
      subject: done ? `Your week in todos: ${done} done` : "Your week in todos",
      body,
      html,
    });
    return "sent" as const;
  }
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
