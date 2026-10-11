// Starting values ("priors") for the knowledge model that runs in shadow mode and in the recommender. NOT tuned on real data:
// the arena showed tuned values vary a lot between runs at this data size. Refit them from the pilot's real logs.
export const SHADOW_PARAMS = { sd0: 100, drift: 12, halfLifeDays: 30, transfer: 0.5, gain: 0 };
