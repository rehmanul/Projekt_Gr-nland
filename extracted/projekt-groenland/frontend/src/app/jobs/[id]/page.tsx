import { notFound } from 'next/navigation';

async function getJob(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/${id}`,
    { cache: 'no-store' }
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const data = await getJob(params.id);
  if (!data) notFound();

  const job = data.data;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-4">{job.title}</h1>
        <div className="mb-6">
          <p className="text-xl text-gray-600">{job.employer_name}</p>
          <p className="text-gray-500">📍 {job.location}</p>
        </div>
        <div className="prose max-w-none">
          <h2>Stellenbeschreibung</h2>
          <p>{job.description}</p>
        </div>
        <div className="mt-8">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Jetzt bewerben
          </button>
        </div>
      </div>
    </main>
  );
}
