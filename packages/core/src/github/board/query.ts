import { ErrorCodes, VisibleError } from "../../error";
import { graphql, type Client } from "../client";
import type { Board } from "./index";

/** Every item on a Project v2 board, a page of 100 at a time. */
export async function read(
  api: Client,
  owner: string,
  number: number,
  cursor: string | null = null,
  items: Board.Item[] = [],
): Promise<Board.Info> {
  const data = await graphql<{ repositoryOwner: { projectV2?: Page | null } | null }>(api, BOARD, {
    owner,
    number,
    cursor,
  });
  const page = data.repositoryOwner?.projectV2;
  if (!page)
    throw new VisibleError(
      "not_found",
      ErrorCodes.NotFound.RESOURCE_NOT_FOUND,
      `No GitHub project #${number} under ${owner}`,
    );
  const next = [...items, ...page.items.nodes.flatMap(item)];
  if (page.items.pageInfo.hasNextPage)
    return read(api, owner, number, page.items.pageInfo.endCursor, next);
  return { id: page.id, title: page.title, description: page.shortDescription, items: next };
}

type Node = {
  status: { name?: string } | null;
  content: {
    databaseId?: number;
    number?: number;
    title?: string;
    body?: string | null;
    state?: string;
    stateReason?: string | null;
    labels?: { nodes: { name: string }[] };
    repository?: { nameWithOwner: string };
    parent?: { databaseId: number } | null;
  } | null;
};

type Page = {
  id: string;
  title: string;
  shortDescription: string | null;
  items: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Node[] };
};

/** Drafts and pull requests carry no issue id, so they drop out here. */
function item(node: Node): Board.Item[] {
  const issue = node.content;
  if (!issue?.databaseId || !issue.number || !issue.repository) return [];
  return [
    {
      id: issue.databaseId,
      number: issue.number,
      title: issue.title ?? "",
      body: issue.body ?? null,
      state: (issue.state ?? "open").toLowerCase(),
      reason: issue.stateReason?.toLowerCase() ?? null,
      labels: issue.labels?.nodes.map((label) => label.name) ?? [],
      repo: issue.repository.nameWithOwner,
      parent: issue.parent?.databaseId ?? null,
      column: node.status?.name ?? null,
    },
  ];
}

const BOARD = `
  query ($owner: String!, $number: Int!, $cursor: String) {
    repositoryOwner(login: $owner) {
      ... on Organization { projectV2(number: $number) { ...Board } }
      ... on User { projectV2(number: $number) { ...Board } }
    }
  }
  fragment Board on ProjectV2 {
    id
    title
    shortDescription
    items(first: 100, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        status: fieldValueByName(name: "Status") {
          ... on ProjectV2ItemFieldSingleSelectValue { name }
        }
        content {
          ... on Issue {
            databaseId
            number
            title
            body
            state
            stateReason
            labels(first: 20) { nodes { name } }
            repository { nameWithOwner }
            parent { databaseId }
          }
        }
      }
    }
  }`;
