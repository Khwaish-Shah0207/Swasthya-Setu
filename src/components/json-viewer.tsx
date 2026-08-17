"use client";

export function JsonViewer({ data }: { data: unknown }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <pre className="scrollbar-thin overflow-auto rounded-lg bg-[#0F1C18] text-[#D7E9DF] p-5 text-xs leading-relaxed font-mono max-h-[70vh]">
      {json}
    </pre>
  );
}
