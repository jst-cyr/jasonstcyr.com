'use client';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { SearchBox, Hits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import { useState } from 'react';

const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const algoliaApiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME!;
const searchClient = algoliasearch(algoliaAppId, algoliaApiKey);

export function Search() {
    const [results, setResults] = useState('');
    
    return (
        <InstantSearchNext 
            searchClient={searchClient} 
            indexName={indexName}
            initialUiState={{
                [indexName]: { query: '' },
            }}
            routing={true}
            future={{
                preserveSharedStateOnUnmount: true,
            }}
            
        >
        <SearchBox
            placeholder="Search for articles..."
            classNames={{
                input: 'bg-gray-800 p-4 rounded-lg',
                submit:'hidden',
                reset: 'hidden',
            }}
        />
        </InstantSearchNext>
    );
}

