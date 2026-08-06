// ABOUTME: Initiationのステップ一覧を表示する。
// ABOUTME: 質問は回答フォーム、クエストは完了ボタンとして進捗保存する。
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProgressEntry } from "@/lib/domain/types";
import type { InitiationStep } from "@/lib/initiation/content";
import { saveStep } from "@/app/initiation/actions";

export function InitiationSteps({
  steps,
  entries,
}: {
  steps: InitiationStep[];
  entries: ProgressEntry[];
}) {
  const byId = new Map(entries.map((entry) => [entry.stepId, entry]));

  return (
    <ol>
      {steps.map((step) => (
        <li key={step.id}>
          <StepItem step={step} entry={byId.get(step.id)} />
        </li>
      ))}
    </ol>
  );
}

function StepItem({ step, entry }: { step: InitiationStep; entry?: ProgressEntry }) {
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(Boolean(entry));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(value: string | null) {
    setError(null);
    startTransition(async () => {
      const result = await saveStep(step.id, value);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "保存できませんでした");
      }
    });
  }

  return (
    <section>
      <h2>
        {step.title} {saved && "✅"}
      </h2>
      {step.kind === "question" ? (
        <>
          <p>{step.prompt}</p>
          <label htmlFor={`answer-${step.id}`}>回答</label>
          <textarea
            id={`answer-${step.id}`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button type="button" disabled={pending} onClick={() => submit(answer)}>
            {pending ? "保存中…" : "回答を保存"}
          </button>
        </>
      ) : (
        <>
          <p>{step.description}</p>
          {!saved && (
            <button type="button" disabled={pending} onClick={() => submit(null)}>
              {pending ? "保存中…" : "完了にする"}
            </button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
