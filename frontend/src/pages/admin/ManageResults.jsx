import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { adminMockResults } from "../../data/navigation";
import { formatDate } from "../../utils/helpers";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";

const PAGE_SIZE = 6;

export default function ManageResults() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return adminMockResults.filter(
      (r) =>
        !q ||
        r.student.toLowerCase().includes(q) ||
        r.test.toLowerCase().includes(q)
    );
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const avg =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Manage Results</h1>
        <p className="page-subtitle">Unofficial practice results (mock data)</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-slate-500">Total results</p>
          <p className="text-2xl font-bold text-navy dark:text-white">{filtered.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Average score</p>
          <p className="text-2xl font-bold text-brand">{avg}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate-500">Highest score</p>
          <p className="text-2xl font-bold text-emerald-600">
            {filtered.length ? Math.max(...filtered.map((r) => r.score)) : "—"}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search student or test..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {pageItems.length === 0 ? (
        <div className="card">
          <EmptyState title="No results" description="No matching mock results." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Test</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {pageItems.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-medium text-navy dark:text-white">{r.student}</td>
                    <td className="px-5 py-3 text-slate-500">{r.test}</td>
                    <td className="px-5 py-3 font-semibold text-brand">{r.score}</td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(r.date)}</td>
                    <td className="px-5 py-3">
                      <span className="badge bg-green-100 text-green-700">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              Page {page}/{totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Prev
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
