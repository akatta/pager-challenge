# pager-challenge
Pager SWE Coding Challenge

## How to run

run `yarn nodemon src/app.ts` to run a auto-refreshing local web app running this code

When the prompt appears, enter your search term (i.e. 'Falcon', 'a new Hope', 'Luke', etc.)

Special commands include `prime` which queries the SW API for all entities to prime the local cache. Each query will also build up the cache but this can run in the background while other queries are executed.

A full matched name will print followed by all the people associated with this Star Wars Entity

## How it works

One observation about the SWApi is that each api object url is keyed by 1) a type and 2) an id.
For example https://swapi.dev/api/people/2 always refers to the same person

So I keyed each "entity" that I encounter from the SWAPI with its type and id and build a "Node" out of it which stores its type, name, and all associations it has in a cache.

Example:

I query for "A New Hope" which is a film and I get back a response from the API for it.

I then create a Node with this information which will store
```
{
  name: "A New Hope"
  key: {
    type: "film",
    id: "1"
  },
  edges: [
    {
      type: "people",
      id: "5"
    },
    ...
  ]
}
```

And store it in the cache keyed by the key `films/1`

We can choose which associations to request for an object as all of them are stored on this node, but by default we only return which people are associated with an object.

Once the cache is primed completely, the only http request that would need to be run is the one to search for a term across the SWAPI database. In a true production environment, a string prefix tree could be built on the cache to allow for partial key lookups and avoid even this http request.

## Improvements for a Production environment

* When many queries are coming in, the cache will be fresher/more primed
* We can run async jobs to prime the cache with all known entities on a semi-daily basis. The SwAPI has a limited amount of entities so we can prime all known objects from the star wars universe as they provide endpoints for this too. But in a world where there were a much larger amount of data served by SWAPI, we can also look at at the most-used queries and prime the information for those.
* Have a string-prefix tree built on top of the cache so that searches could also be performed in memory first against the cache before firing off an http request

