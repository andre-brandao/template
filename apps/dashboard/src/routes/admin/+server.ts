import { redirect } from "@sveltejs/kit";

export const GET = () => redirect(308, "/admin/users");
