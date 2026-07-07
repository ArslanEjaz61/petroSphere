import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, User, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Msg = { role: "user" | "assistant"; content: string };

type CopilotCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  ask: (prompt: string) => void;
};
const Ctx = createContext<CopilotCtx | null>(null);
export const useCopilot = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCopilot outside provider");
  return v;
};

const SUGGESTIONS = [
  "Summarize this week's deal pipeline",
  "Show buyers in UAE",
  "Generate an LOI for diesel EN590",
  "Explain today's Brent movement",
  "What documents are missing across active deals?",
];

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const ask = useCallback((prompt: string) => {
    setPending(prompt);
    setOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, setOpen, ask }), [open, ask]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <CopilotInner pending={pending} clearPending={() => setPending(null)} />
    </Ctx.Provider>
  );
}

function CopilotInner({ pending, clearPending }: { pending: string | null; clearPending: () => void }) {
  const { open, setOpen } = useCopilot();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: `Error: ${msg}` };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming]);

  useEffect(() => {
    if (pending && open) {
      send(pending);
      clearPending();
    }
  }, [pending, open, send, clearPending]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> PetroSphere Copilot
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ask anything about deals, customers, market, or compliance. I can also draft documents.
              </p>
              <div className="space-y-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left rounded-md border bg-card px-3 py-2 text-sm hover:border-primary hover:bg-accent transition"
                  >{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content || (streaming && i === messages.length - 1 ? <Loader2 className="h-3 w-3 animate-spin" /> : "")}
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              placeholder="Ask Copilot…"
              rows={1}
              className="min-h-[40px] max-h-32 resize-none"
              disabled={streaming}
            />
            <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Mounted in protected layout; consumes the same Ctx as the trigger.
// All UI lives in CopilotInner inside the provider; this is just a no-op marker
// so the layout file can keep a clear name.
export function CopilotPanel() { return null; }
