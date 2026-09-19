import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { createDocument, deleteDocument, listDocuments } from "@/api/documents";
import { getProject } from "@/api/projects";
import { DocumentType } from "@/types";

const TYPES: DocumentType[] = ["DRAWING", "CONTRACT", "PURCHASE", "BILL", "PHOTO", "CERTIFICATE", "OTHER"];

const TYPE_LABELS: Record<string, string> = {
  DRAWING: "Drawing",
  CONTRACT: "Contract",
  PURCHASE: "Purchase",
  BILL: "Bill",
  PHOTO: "Photo",
  CERTIFICATE: "Certificate",
  OTHER: "Other",
};

export default function ProjectDocuments() {
  const { id } = useParams<{ id: string }>();
  const projectId = id!;
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(projectId),
  });
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: () => listDocuments(projectId),
  });

  const [form, setForm] = useState({ name: "", type: "DRAWING" as DocumentType, url: "" });
  const add = useMutation({
    mutationFn: () => createDocument(projectId, form),
    onSuccess: () => {
      setForm({ name: "", type: "DRAWING", url: "" });
      queryClient.invalidateQueries({ queryKey: ["documents", projectId] });
    },
  });
  const remove = useMutation({
    mutationFn: (docId: string) => deleteDocument(docId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", projectId] }),
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-concrete-900">Documents</h1>
      <p className="mb-6 text-sm text-concrete-400">
        {project ? `${project.name} (${project.code})` : "Loading…"} — drawings, contracts, bills, and
        certificates. Files are linked, not uploaded — paste a link to where the file already lives
        (Drive, S3, etc.).
      </p>

      <div className="mb-4 overflow-hidden rounded-md border border-concrete-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-concrete-200 bg-concrete-50 text-left text-xs uppercase tracking-wide text-concrete-400">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Uploaded</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-concrete-100">
            {documents?.map((doc) => (
              <tr key={doc.id}>
                <td className="px-4 py-2">
                  <a href={doc.url} target="_blank" rel="noreferrer" className="font-medium text-blueprint-700 hover:underline">
                    {doc.name}
                  </a>
                </td>
                <td className="px-4 py-2 text-concrete-500">{TYPE_LABELS[doc.type]}</td>
                <td className="px-4 py-2 text-concrete-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => remove.mutate(doc.id)} className="text-concrete-400 hover:text-signal-red">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="px-4 py-4 text-sm text-concrete-400">Loading…</p>}
        {!isLoading && documents?.length === 0 && (
          <p className="px-4 py-4 text-sm text-concrete-400">No documents added yet.</p>
        )}
      </div>

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          if (form.name.trim() && form.url.trim()) add.mutate();
        }}
        className="flex flex-wrap gap-2"
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Document name"
          className="w-56 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as DocumentType })}
          className="rounded border border-concrete-200 px-3 py-2 text-sm"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <input
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="Link (Drive, S3, etc.)"
          className="w-72 rounded border border-concrete-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={add.isPending}
          className="flex items-center gap-1.5 rounded bg-blueprint-900 px-3 py-2 text-sm font-medium text-white hover:bg-blueprint-800 disabled:opacity-60"
        >
          <Plus size={15} />
          Add document
        </button>
      </form>
    </div>
  );
}
