import { Search } from '@/components/Search'; 

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  return (
    <main className="container mx-auto min-h-screen max-w-4xl p-8">
        <Search />
    </main>
  );
}
