import { query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { Insights } from '@template/core/todo';
import { Actor } from '@template/core/actor';

function auth() {
  if (Actor.use().type !== 'user') redirect(303, '/login');
}

export const getCounts = query(Insights.Range, async (input) => {
  auth();
  return Insights.counts(input);
});

export const getOverdue = query(async () => {
  auth();
  return Insights.overdue();
});

export const getDue = query(async () => {
  auth();
  return Insights.due();
});

export const getActivity = query(Insights.Range, async (input) => {
  auth();
  return Insights.activity(input);
});
