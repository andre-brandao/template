/** A user's pick in one experiment. */
export type Vote = { variant: string; comment: string | null };

/** Where an experiment stands: votes per variant, the viewer's own, and where they're kept. */
export type Tally = { votes: Record<string, number>; mine: Vote | null; url?: string };

export type Ballot = {
  key: string;
  title: string;
  variant: string;
  /** The variant's human name, for wherever the vote is read by people. */
  label: string;
  comment?: string;
  user: { id: string; name: string };
};

/** Where votes go. One file per backend under `adapter/`, registered in `driver.ts`. */
export interface Adapter {
  tally(key: string, title: string, user: string): Promise<Tally>;
  /** One vote per user per experiment: voting again replaces it. */
  vote(ballot: Ballot): Promise<void>;
  /** Optional exposure hook, for analytics backends that count who saw what. */
  expose?(key: string, variant: string, user: string): void;
}
