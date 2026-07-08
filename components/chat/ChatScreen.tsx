"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Ban, Send } from "lucide-react";
import { C, Role } from "@/lib/theme";
import { Pose } from "@/lib/poses";
import { Message, POSEUR_QUESTIONS, reponsesPour } from "@/lib/chat";
import { createClient } from "@/lib/supabase/client";

export default function ChatScreen({
  pose,
  role,
  onBack,
}: {
  pose: Pose;
  role: Role;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Côté entreprise : réponses ciblées selon la dernière question du poseur.
  let derniereQuestion: string | null = null;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender_id !== myId) {
      derniereQuestion = messages[i].texte;
      break;
    }
  }
  const options =
    role === "poseur" ? POSEUR_QUESTIONS : reponsesPour(derniereQuestion);

  function appendMsg(m: Message) {
    setMessages((cur) =>
      cur.some((x) => x.id === m.id) ? cur : [...cur, m],
    );
  }

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active) setMyId(user?.id ?? null);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("pose_id", pose.id)
        .order("created_at", { ascending: true });
      if (active) setMessages((data as Message[]) ?? []);
    })();

    // Temps réel : nouveaux messages de cette pose
    const channel = supabase
      .channel(`chat-${pose.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `pose_id=eq.${pose.id}`,
        },
        (payload) => appendMsg(payload.new as Message),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [pose.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function envoyer(texte: string) {
    setSending(true);
    setErreur(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ pose_id: pose.id, texte })
      .select()
      .single();
    if (error) {
      setErreur("Message non envoyé. Réessayez.");
    } else if (data) {
      appendMsg(data as Message);
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col">
      {/* En-tête */}
      <div
        className="flex items-center gap-2 border-b bg-white px-4 py-3"
        style={{ borderColor: C.line }}
      >
        <button onClick={onBack} style={{ color: C.teal }}>
          <ChevronLeft size={22} />
        </button>
        <div>
          <div className="text-sm font-bold" style={{ color: C.ink }}>
            {role === "poseur" ? "Entreprise" : "Poseur"} ·{" "}
            {pose.prestations.join(" · ")}
          </div>
          <div className="text-[11px]" style={{ color: C.muted }}>
            {pose.ville} · {pose.departement}
          </div>
        </div>
      </div>

      {/* Avertissement */}
      <div
        className="flex items-start gap-2 px-4 py-2.5 text-[11px]"
        style={{ background: C.amberBg, color: C.amber }}
      >
        <Ban size={14} className="mt-0.5 shrink-0" />
        Messages prédéfinis uniquement. Tout échange de coordonnées ou contact
        hors plateforme est interdit.
      </div>

      {/* Fil des messages */}
      <div className="flex flex-col gap-2 p-4" style={{ background: C.bg }}>
        {messages.length === 0 && (
          <div
            className="rounded-2xl p-4 text-center text-sm"
            style={{ background: "#fff", border: `1px dashed ${C.line}`, color: C.muted }}
          >
            Choisissez un message ci-dessous pour démarrer.
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div
              key={m.id}
              className="max-w-[80%] rounded-2xl px-3.5 py-2.5"
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                background: mine ? C.teal : "#fff",
                color: mine ? "#fff" : C.ink,
                border: mine ? "none" : `1px solid ${C.line}`,
              }}
            >
              <div className="text-sm">{m.texte}</div>
              <div
                className="mt-1 text-[10px]"
                style={{ color: mine ? "rgba(255,255,255,0.7)" : C.muted }}
              >
                {new Date(m.created_at).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Messages prédéfinis (aucun champ libre) */}
      <div
        className="sticky bottom-0 z-10 border-t bg-white px-4 py-3 pb-4"
        style={{
          borderColor: C.line,
          boxShadow: "0 -6px 16px rgba(11,61,58,0.06)",
        }}
      >
        <div
          className="text-xs font-bold tracking-wide"
          style={{ color: C.muted }}
        >
          {role === "poseur" ? "QUESTIONS AUTORISÉES" : "RÉPONSES RAPIDES"}
        </div>
        {role === "entreprise" && derniereQuestion && (
          <div className="mb-2 mt-0.5 text-xs" style={{ color: C.teal }}>
            En réponse à : « {derniereQuestion} »
          </div>
        )}
        {!(role === "entreprise" && derniereQuestion) && <div className="mb-2" />}
        {erreur && (
          <div
            className="mb-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{ background: C.redBg, color: C.red }}
          >
            {erreur}
          </div>
        )}
        <div className="flex flex-col gap-2">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => envoyer(o)}
              disabled={sending}
              className="flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium disabled:opacity-60"
              style={{ border: `1px solid ${C.line}`, color: C.ink, background: "#fff" }}
            >
              {o}
              <Send size={15} color={C.orange} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
