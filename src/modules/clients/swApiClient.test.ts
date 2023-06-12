import { EntityType } from '../../types/types';
import { SWApiClient, convertToNode, createEdge, parseUrl } from './swApiClient';
import NodeCache from 'node-cache';

describe('parseUrl', () => {
  it('parses good url', () => {
    const goodUrl = 'https://swapi.dev/api/people/3';
    const { entityType, id } = parseUrl(goodUrl);
    expect(entityType).toEqual('people');
    expect(id).toEqual('3');
  });
  it('parses url with no id', () => {
    const goodUrl = 'https://swapi.dev/api/people';
    const { entityType, id } = parseUrl(goodUrl);
    expect(entityType).toEqual('people');
    expect(id).toBeUndefined();
  });
  it('has invalid url', () => {
    const badUrl = 'asgacagsasd';
    expect(() => {
      parseUrl(badUrl);
    }).toThrow();
  });
  it('parses with a search query', () => {
    const goodUrlWithSearch = 'https://swapi.dev/api/people?search=kenobi';
    const { entityType, id } = parseUrl(goodUrlWithSearch);
    expect(entityType).toEqual('people');
    expect(id).toBeUndefined();
  });
});

describe('convertToNode', () => {
  const MOCK_API_RESPONSE = {
    name: 'Obi-Wan Kenobi',
    height: 182,
    films: ['https://swapi.dev/api/films/1/', 'https://swapi.dev/api/films/2/', 'https://swapi.dev/api/films/3/'],
    vehicles: ['https://swapi.dev/api/vehicles/38/'],
    url: 'https://swapi.dev/api/people/10/',
  };

  it('converts Api response to node', () => {
    const node = convertToNode(MOCK_API_RESPONSE);
    expect(node.name).toEqual('Obi-Wan Kenobi');
    expect(node.key).toMatchObject({
      type: 'people',
      id: '10',
    });
    expect(node.edges.length).toEqual(4);
  });
  it('converts API response with no relations', () => {
    const apiResponse = {
      name: 'Obi-Wan Kenobi',
      url: 'https://swapi.dev/api/people/10/',
    };
    const node = convertToNode(apiResponse);
    expect(node).toMatchObject({
      name: 'Obi-Wan Kenobi',
      key: expect.objectContaining({
        type: 'people',
        id: '10',
      }),
    });
    expect(node.edges.length).toEqual(0);
  });
  it('converts Edge of url type', () => {
    const edge = createEdge('https://swapi.dev/api/people/10/');
    expect(edge).toMatchObject({
      type: 'people',
      id: '10',
    });
  });
  it('converting Edge of non-url type', () => {
    const edge = createEdge('Obi-wan Kenobi');
    expect(edge).toBeUndefined();
  });
});

describe('Testing cache values while fetching', () => {
  const MOCK_API_RESPONSE = {
    name: 'Obi-Wan Kenobi',
    height: 182,
    films: ['https://swapi.dev/api/films/1/', 'https://swapi.dev/api/films/2/', 'https://swapi.dev/api/films/3/'],
    vehicles: ['https://swapi.dev/api/vehicles/38/'],
    url: 'https://swapi.dev/api/people/10/',
  };
  const queryCache = new NodeCache();
  const nodeCache = new NodeCache();
  const apiClient = new SWApiClient(queryCache, nodeCache);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetching object populated cache', async () => {
    jest.spyOn(apiClient, 'fetchData').mockImplementation(() => Promise.resolve().then(() => MOCK_API_RESPONSE));
    await apiClient.fetchObject({ entityType: 'people', id: '10' });
    expect(nodeCache.keys().length).toEqual(1);
    expect(nodeCache.get(`people/10`)).toMatchObject({
      key: expect.objectContaining({
        type: 'people',
        id: '10',
      }),
      name: 'Obi-Wan Kenobi',
      edges: expect.arrayContaining([
        {
          type: 'films',
          id: '1',
        },
        {
          type: 'films',
          id: '2',
        },
        {
          type: 'films',
          id: '3',
        },
        {
          type: 'vehicles',
          id: '38',
        },
      ]),
    });
  });
  it('fetching all pages populates cache', async () => {
    jest
      .spyOn(apiClient, 'getPage')
      .mockImplementation((entityType: EntityType, page: number) => Promise.resolve().then(() => page1Response));
    jest.spyOn(apiClient, 'fetchData').mockImplementation((query: string) =>
      Promise.resolve().then(() => {
        if (query === 'next.url') return page2Response;
      })
    );
    const page1Response = {
      count: 4,
      previous: null,
      next: 'next.url',
      results: [
        {
          name: 'Obi-Wan Kenobi',
          height: 182,
          films: ['https://swapi.dev/api/films/1/', 'https://swapi.dev/api/films/2/', 'https://swapi.dev/api/films/3/'],
          vehicles: ['https://swapi.dev/api/vehicles/38/'],
          url: 'https://swapi.dev/api/people/10/',
        },
        {
          name: 'Luke Skywalker',
          height: 182,
          films: ['https://swapi.dev/api/films/1/'],
          vehicles: ['https://swapi.dev/api/vehicles/42/'],
          url: 'https://swapi.dev/api/people/5/',
        },
      ],
    };
    const page2Response = {
      count: 4,
      previous: null,
      next: null,
      results: [
        {
          name: 'Darth Vader',
          height: 182,
          films: ['https://swapi.dev/api/films/1/', 'https://swapi.dev/api/films/2/', 'https://swapi.dev/api/films/3/'],
          vehicles: ['https://swapi.dev/api/vehicles/38/'],
          url: 'https://swapi.dev/api/people/2/',
        },
        {
          name: 'Han Solo',
          height: 182,
          films: ['https://swapi.dev/api/films/1/'],
          vehicles: ['https://swapi.dev/api/vehicles/42/'],
          url: 'https://swapi.dev/api/people/9/',
        },
      ],
    };
    await apiClient.getAll('people');
    expect(nodeCache.keys().length).toEqual(4);
    expect(nodeCache.keys()).toMatchObject(expect.arrayContaining(['people/9', 'people/5', 'people/10', 'people/2']));
  });
});
