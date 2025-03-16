'use client';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import { SearchBox, Hits } from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import { useState } from 'react';
import Link from 'next/link';
import ArticleResult from './ArticleResult';

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
            onStateChange={({ uiState }) => {
                setResults(uiState[indexName]?.query || '');
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
        {/* Hits component to display results */}
        {results && (
                <div className="text-left mt-4">
                    <h2 className="text-2xl font-semibold">Results for: {results}</h2>

                    <Hits
                        hitComponent={({ hit }) => (
                            <ArticleResult
                                id={hit._id}
                                slug={hit.slug}
                                title={hit.title}
                                summary={hit.body}
                                publishedAt={hit.publishedAt}
                                image={hit.image}
                            />
                        )}
                    />
                </div>
            )}
        </InstantSearchNext>
    );
}

