import { topics as tdb } from "@/lib/db";
import AdminForm from "./AdminForm";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export const metadata = { title: "Admin | Faith & Scripture" };

export default async function AdminPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const existingTopics = tdb.list().map((t) => t.name);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin</h1>
      <p className="text-sm text-gray-500 mb-8">Add a new question to the database.</p>
      <AdminForm existingTopics={existingTopics} error={error} />
    </div>
  );
}
