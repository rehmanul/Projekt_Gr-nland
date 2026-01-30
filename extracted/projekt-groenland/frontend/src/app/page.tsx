import JobList from '@/components/JobList';
import SearchBar from '@/components/SearchBar';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Badische Jobs
        </h1>
        <p className="text-xl text-gray-600">
          Statt Fernweh - dein nächster Job ist näher als du denkst
        </p>
      </header>

      <SearchBar />
      <JobList />
    </main>
  );
}
