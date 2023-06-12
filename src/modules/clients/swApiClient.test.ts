import { SWApiClient, convertToNode, createEdge, parseUrl } from './swApiClient';

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
