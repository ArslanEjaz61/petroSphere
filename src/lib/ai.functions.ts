import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ documentId: z.string().uuid() });

export const summarizeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase } = context;

    const { data: doc, error } = await supabase
      .from("documents")
      .select("id,name,category,storage_path,mime_type")
      .eq("id", data.documentId)
      .single();
    if (error || !doc) throw new Error("Document not found");

    // Try fetch text content (only summarize text-like docs for MVP)
    let snippet = `Document: ${doc.name}\nCategory: ${doc.category}\nType: ${doc.mime_type ?? "unknown"}`;
    if (doc.mime_type?.startsWith("text/") || doc.name.match(/\.(txt|md|csv|json)$/i)) {
      const { data: file } = await supabase.storage.from("documents").download(doc.storage_path);
      if (file) {
        const text = await file.text();
        snippet += `\n\n---\n${text.slice(0, 8000)}`;
      }
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You analyze petroleum trade documents. Produce a tight 4-6 bullet summary covering: parties, product, quantity, price, key terms, and any red flags. Markdown bullets only.",
          },
          { role: "user", content: snippet },
        ],
      }),
    });
    if (!upstream.ok) {
      const t = await upstream.text();
      throw new Error(`AI error: ${t.slice(0, 200)}`);
    }
    const json = (await upstream.json()) as { choices: { message: { content: string } }[] };
    const summary = json.choices[0]?.message?.content ?? "";

    await supabase.from("documents").update({ ai_summary: summary }).eq("id", data.documentId);

    return { summary };
  });
