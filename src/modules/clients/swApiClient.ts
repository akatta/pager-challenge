import fetch from 'node-fetch';
import {
  Edge,
  EntityType,
  SearchResult,
  SearchResultEmptyError,
  SwEntity,
  SwNode,
  entityTypes,
} from '../../types/types';
import _ from 'lodash';
import NodeCache from 'node-cache';

export function parseUrl(url: string) {
  const urlObj = new URL(url);
  const path = urlObj.pathname.replace('/api/', '');
  return {
    entityType: path.split('/')[0] as EntityType,
    id: path.split('/')?.[1],
  };
}

export function generateNodeCacheKey(entityType: string, id: string): string {
  return `${entityType.toString()}/${id}`;
}

export class SWApiClient {
  root_url: string;
  queryCache: NodeCache;
  nodeCache: NodeCache;

  constructor(queryCache, nodeCache) {
    this.root_url = `https://swapi.dev/api`;
    this.queryCache = queryCache;
    this.nodeCache = nodeCache;
  }

  async fetchData(path: string) {
    const cacheHit = this.queryCache.get(path);
    if (cacheHit) {
      return JSON.parse(cacheHit as string);
    }
    const result = await fetch(path, { method: 'GET' }).then((result) => result.json());
    this.queryCache.set<string>(path, JSON.stringify(result));
    return result;
  }

  async fetchObject({ entityType, id }: { entityType: EntityType; id: string }): Promise<SwNode> {
    const cacheResult = this.nodeCache.get<SwNode>(`${entityType}/${id}`);
    if (cacheResult) {
      return cacheResult;
    }
    const url = this.constructUrlForFetch({ entityType, id });
    const apiData = await this.fetchData(url);
    const sanitizedApiData = convertToNode(apiData);
    this.nodeCache.set<SwNode>(generateNodeCacheKey(entityType, id), sanitizedApiData);
    return sanitizedApiData;
  }

  async getPage(entityType: EntityType, page: number) {
    return this.fetchData(this.constructUrlForFetch({ entityType, page }));
  }

  async getAll(entityType: EntityType): Promise<SwNode[]> {
    const results: any[] = [];
    const first = await this.getPage(entityType, 1);
    results.push(first);
    let nextUrl = first?.['next'];
    while (nextUrl) {
      const next = await this.fetchData(nextUrl);
      results.push(next);
      nextUrl = next?.['next'];
    }

    const allResults: SwEntity[] = _.flatten(results.map((result) => result.results as SwEntity[]));
    const nodeResults = allResults.map((result) => {
      const { entityType, id } = parseUrl(result.url);
      const newNode = convertToNode(result);
      this.nodeCache.set<SwNode>(generateNodeCacheKey(entityType, id), newNode);
      return newNode;
    });
    return nodeResults;
  }

  async searchByQuery(query: string): Promise<SwNode> {
    const promises: Promise<SearchResult>[] = [];
    for (const entityType of entityTypes) {
      promises.push(this.fetchData(this.constructUrlForFetch({ entityType, search: query })));
    }
    const resolvedSearchResults: SearchResult[] = (await Promise.all(promises)).filter((p) => p.count);
    if (!resolvedSearchResults?.length) {
      throw new SearchResultEmptyError();
    }
    return convertToNode(resolvedSearchResults[0].results[0]);
  }

  constructUrlForFetch({
    entityType,
    id,
    page,
    search,
  }: {
    entityType: EntityType;
    id?: string;
    page?: number;
    search?: string;
  }) {
    let url = new URL(this.root_url);
    url.pathname += `/${entityType.toString()}`;
    if (id) url.pathname += `/${id}`;
    if (page) url.searchParams.append('page', page.toString());
    if (search) url.searchParams.append('search', search);
    return url.href;
  }

  async flushCache() {
    await this.nodeCache.flushAll();
  }
}

export function convertToNode(resp: SwEntity): SwNode {
  const { entityType, id } = parseUrl(resp.url);
  const edges = Object.entries(resp).map(([key, val]) => {
    if (key === 'url') {
      return;
    }
    if (val instanceof Array) {
      const foo = val.map((v) => createEdge(v));
      return foo;
    }
    const bar = createEdge(val);
    return bar;
  });
  return {
    key: {
      type: entityType,
      id,
    },
    edges: _.compact(_.flatten(edges)),
    // most entity types have name, films have title, and leave blank if
    // none are found
    name: resp?.['name'] || resp?.['title'] || '',
  };
}

export function createEdge(val: string): Edge | undefined {
  try {
    const { entityType: valEntityType, id: valId } = parseUrl(val);
    return {
      type: valEntityType,
      id: valId,
    };
  } catch (_) {
    return;
  }
}
