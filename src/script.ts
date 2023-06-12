import { SWApiClient } from './modules/clients/swApiClient';
import { getNamesRelatedToSearch } from './swapi';

const run = () => {
  Promise.resolve().then(async () => {
    const apiClient = new SWApiClient();
    console.log(await getNamesRelatedToSearch('Hope', ['people'], apiClient));
    // const result = await starWarsClient.getAll('people');
    // console.log(result.length)
  });
};

run();
