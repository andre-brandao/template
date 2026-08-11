import { query } from "$app/server";
import { z } from "zod";
import { Project } from "@template/core/project";
import { auth } from "$lib/server/remote";

/**
 * Resolves a `{source, sourceID}` ref to whatever a page needs to label it,
 * so slices can display a scope without importing its owning feature.
 * New source kinds extend the dispatch here.
 */
export const getSource = query(
  z.object({ source: z.string(), sourceID: z.string() }),
  async (ref) => {
    auth();
    if (ref.source !== "project") return null;
    const project = await Project.fromID(ref.sourceID);
    return project ? { name: project.name } : null;
  },
);
