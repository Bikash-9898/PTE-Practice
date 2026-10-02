import { useEffect, useState } from "react";
import { FiSearch, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import EmptyState from "../../components/common/EmptyState";
import { formatDate } from "../../utils/helpers";

const PAGE_SIZE = 5;

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStudents = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search.trim()) params.set("search", search.trim());
    if (status !== "all") params.set("status", status);

    fetch(`/api/admin/students?${params.toString()}`, { credentials: "include" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.message || "Failed to load students");
        return payload;
      })
      .then((payload) => {
        setStudents(payload.data || []);
        setTotal(payload.pagination?.total || 0);
        setTotalPages(payload.pagination?.pages || 1);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
  }, [page, search, status]);

  const confirmDelete = async () => {
    try {
      const response = await fetch(`/api/admin/students/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Failed to delete student");
      setDeleteId(null);
      toast.success("Student removed");
      if (students.length === 1 && page > 1) setPage((current) => current - 1);
      else loadStudents();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Manage Students</h1>
        <p className="page-subtitle">Registered students from the server</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search name or email..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input w-auto"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-500">Loading students...</div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">{error}</div>
      ) : students.length === 0 ? (
        <div className="card">
          <EmptyState title="No students found" description="Try a different search or filter." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Practices</th>
                  <th className="px-5 py-3">Avg</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {students.map((student) => (
                  <tr key={student._id || student.id}>
                    <td className="px-5 py-3 font-medium text-navy dark:text-white">{student.name}</td>
                    <td className="px-5 py-3 text-slate-500">{student.email}</td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(student.createdAt)}</td>
                    <td className="px-5 py-3">{student.practices}</td>
                    <td className="px-5 py-3 font-semibold text-brand">{student.avgScore}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`badge ${
                          student.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDeleteId(student._id || student.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages} · {total} students
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Prev
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Remove student?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This permanently deletes the student and their saved practice data from the server.
        </p>
      </Modal>
    </div>
  );
}
