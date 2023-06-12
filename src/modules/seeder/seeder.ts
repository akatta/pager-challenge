import { SWApiClient } from '../clients/swApiClient';

export async function preProcessSwData(apiClient: SWApiClient) {
  const promises = [
    apiClient.getAll('people'),
    apiClient.getAll('species'),
    apiClient.getAll('people'),
    apiClient.getAll('films'),
    apiClient.getAll('planets'),
    apiClient.getAll('vehicles'),
  ];
  await Promise.all(promises);
}
