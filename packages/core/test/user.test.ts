import { describe, expect } from "bun:test";
import { User } from "../src/user";
import { withTestUser } from "./util";

describe("user", () => {
  withTestUser("can be looked up by id and email", async ({ userID, email }) => {
    const byID = await User.fromID(userID);
    expect(byID?.email).toBe(email);

    const byEmail = await User.fromEmail(email);
    expect(byEmail?.id).toBe(userID);
  });

  withTestUser("update changes the name", async ({ userID }) => {
    await User.update({ name: "New Name" });
    const user = await User.fromID(userID);
    expect(user?.name).toBe("New Name");
  });
});
