import { SWApiClient } from './modules/clients/swApiClient';
import _ from 'lodash';
import { EntityType, SearchResultEmptyError, SwNode } from './types/types';

export async function getNamesRelatedToSearch(query: string, entityTypes: EntityType[], apiClient: SWApiClient): Promise<{message: string; names: string[]}> {
let result: SwNode;
  try {
    result = await apiClient.searchByQuery(query);
  } catch (e) {
    if (e instanceof SearchResultEmptyError) {
      return Promise.resolve({message: `No Star wars entity found for query ${query}`, names: []});
    }
    throw e;
  }
  return {
    message: result.name,
    names: await Promise.all(Object.values(result.edges)
      .filter((edge) => entityTypes.includes(edge.type))
      .map(async (edge) => {
        const person = await apiClient.fetchObject({ entityType: edge.type, id: edge.id });
        return person.name;
      }))
    };
}
