import type { DocumentSummary } from "../types";

interface DocumentPanelProps {
  documents: DocumentSummary[];
}

export function DocumentPanel({ documents }: DocumentPanelProps) {
  return (
    <section className="w-72 shrink-0 border-l border-slate-200 bg-slate-50">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-700">Case Materials</h3>
      </div>
      <div className="space-y-3 px-5 pb-6">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600 shadow-sm transition hover:border-primary-200 hover:text-primary-700"
          >
            <div className="font-medium text-slate-700">{doc.file_name}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
              Uploaded {new Date(doc.created_at).toLocaleDateString()}
            </div>
          </a>
        ))}
        {!documents.length && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-xs text-slate-400">
            Upload documents to enrich Lexi’s reasoning context.
          </p>
        )}
      </div>
    </section>
  );
}

