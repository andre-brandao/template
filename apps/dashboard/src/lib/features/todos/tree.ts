import type { Todo } from "@template/core/todo";

/** A todo in tree order, with its depth and the progress of everything beneath it. */
export type Node = Todo.Info & { depth: number; total: number; done: number };

/**
 * Pre-order over whatever loaded. Top-level rows keep the server's sort; sub-issues follow
 * their manual `position`. A todo whose parent was filtered out shows at the top level.
 */
export function tree(todos: Todo.Info[]): Node[] {
  const ids = new Set(todos.map((todo) => todo.id));
  const kids = todos.reduce((map, todo) => {
    const key = todo.parentID && ids.has(todo.parentID) ? todo.parentID : null;
    map.set(key, [...(map.get(key) ?? []), todo]);
    return map;
  }, new Map<string | null, Todo.Info[]>());
  const walk = (parent: string | null, depth: number): Node[] =>
    (kids.get(parent) ?? [])
      .toSorted((a, b) => (parent ? a.position - b.position : 0))
      .flatMap((todo) => {
        const below = walk(todo.id, depth + 1);
        const done = below.filter((node) => node.status === "done").length;
        return [{ ...todo, depth, total: below.length, done }, ...below];
      });
  return walk(null, 0);
}

/** Drops every node under a collapsed one. */
export function visible(nodes: Node[], closed: ReadonlySet<string>) {
  const hidden = new Set<string>();
  return nodes.filter((node) => {
    if (!node.parentID || !(closed.has(node.parentID) || hidden.has(node.parentID))) return true;
    hidden.add(node.id);
    return false;
  });
}

/** Where indent and outdent would put a node: under the sibling above, or after its parent. */
export function moves(nodes: Node[], node: Node) {
  const parent = nodes.find((other) => other.id === node.parentID);
  const above = nodes
    .slice(0, nodes.indexOf(node))
    .findLast((other) => other.parentID === node.parentID && other.depth === node.depth);
  return {
    indent: above ? { id: node.id, parentID: above.id } : undefined,
    outdent: parent
      ? { id: node.id, parentID: parent.parentID, position: parent.position + 1 }
      : undefined,
  };
}
