// ABOUTME: Initiationのステップ一覧を表示する。
// ABOUTME: 質問は回答フォーム、クエストは完了ボタンとして進捗保存する。
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProgressEntry } from "@/lib/domain/types";
import type { InitiationStep } from "@/lib/initiation/content";
import { saveStep } from "@/app/initiation/actions";
import { buttonStyles, inputStyles } from "@/lib/ui";

export function InitiationSteps({
  steps,
  entries,
}: {
  steps: InitiationStep[];
  entries: ProgressEntry[];
}) {
  const byId = new Map(entries.map((entry) => [entry.stepId, entry]));

  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" key={step.id}>
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
      <h2 className="text-xl font-bold text-foreground">
        {step.title} {saved && "✅"}
      </h2>
      {step.kind === "question" ? (
        <>
          <p className="mt-2 leading-7 text-muted">{step.prompt}</p>
          <label className="mt-4 block text-sm font-semibold text-foreground" htmlFor={`answer-${step.id}`}>
            回答
          </label>
          <textarea
            className={`${inputStyles} mt-2 min-h-28 resize-y`}
            id={`answer-${step.id}`}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <button className={`${buttonStyles.primary} mt-3`} type="button" disabled={pending} onClick={() => submit(answer)}>
            {pending ? "保存中…" : "回答を保存"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 leading-7 text-muted">{step.description}</p>
          {!saved && (
            <button className={`${buttonStyles.secondary} mt-3`} type="button" disabled={pending} onClick={() => submit(null)}>
              {pending ? "保存中…" : "完了にする"}
            </button>
          )}
        </>
      )}
      {error && <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300" role="alert">{error}</p>}
    </section>
  );
}
