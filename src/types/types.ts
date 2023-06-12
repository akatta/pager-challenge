export const entityTypes = ['people', 'planets', 'films', 'vehicles', 'starships', 'species'] as const;
export type EntityType = (typeof entityTypes)[number];

export interface SwNode {
  key: NodeKey;
  name: string;
  edges: Edge[];
}

export interface NodeKey {
  type: EntityType;
  id: string;
}

export interface Edge {
  type: EntityType;
  id: string;
}

export interface SwEntity {
  url: string;
}

export interface SearchResult {
  count: number;
  next?: string;
  previous?: string;
  results: SwEntity[];
}

export class SearchResultEmptyError extends Error {}
