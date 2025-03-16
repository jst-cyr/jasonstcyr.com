+'use client';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { SearchBox } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';

const algoliaAppId = process.env.ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.ALGOLIA_INDEX_NAME!;
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

export function Search() {
  return (
    <InstantSearchNext 
        searchClient={searchClient} 
        indexName={indexName}
        routing={true}
    >
      <SearchBox />
    </InstantSearchNext>
  );
}

