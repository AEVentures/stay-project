const steps = [
  {
    letter: 'Q',
    title: 'Question',
    body: 'Ask directly: "Are you thinking about suicide?" Asking does not plant the idea — it opens the door.',
  },
  {
    letter: 'P',
    title: 'Persuade',
    body: 'Listen without judgment. Stay calm, take them seriously, and let them know you want them to get support.',
  },
  {
    letter: 'R',
    title: 'Refer',
    body: 'Connect them to help — 988, a counselor, a trusted adult, or a warmline — and follow up afterward.',
  },
];

export function HowToHelp() {
  return (
    <section id="how-to-help" className="bg-white px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-calm-600">
          What you can do
        </p>
        <h2 className="max-w-3xl font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink-800 sm:text-5xl">
          You don't need to be an expert to help someone stay alive.
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink-600">
          QPR — Question, Persuade, Refer — is a widely taught gatekeeper
          model, similar in spirit to CPR: a simple set of steps anyone can
          learn to help someone in crisis get to the next moment.
        </p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.letter} className="relative rounded-2xl border border-ink-100 bg-cream p-8">
              <div className="font-display text-6xl font-bold text-glow-400/70">{s.letter}</div>
              <h3 className="mt-4 font-display text-2xl font-semibold text-ink-800">{s.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-ink-600">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-care-200 bg-care-50 p-6">
            <h3 className="font-display text-xl font-semibold text-care-800">Say instead of...</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-700">
              <li>
                <span className="font-semibold text-care-700">Say:</span> "I'm
                glad you told me. I'm here, and we'll figure this out
                together."
              </li>
              <li>
                <span className="font-semibold text-care-700">Say:</span> "You
                matter to me. Can we call 988 together right now?"
              </li>
              <li>
                <span className="font-semibold text-care-700">Avoid:</span>{' '}
                "You have so much to live for" or "Don't be selfish" — it can
                deepen shame instead of opening a conversation.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-ink-100 bg-cream p-6">
            <h3 className="font-display text-xl font-semibold text-ink-800">If you are the one struggling</h3>
            <p className="mt-4 text-sm leading-relaxed text-ink-600">
              Reaching out is not weakness. Call or text{' '}
              <a href="tel:988" className="font-semibold text-calm-700 underline">
                988
              </a>{' '}
              or text HOME to{' '}
              <a href="sms:741741&body=HOME" className="font-semibold text-calm-700 underline">
                741741
              </a>{' '}
              any time, day or night. You can also tell one person you trust —
              a friend, a family member, a teacher, a coworker. You do not
              have to have the right words. You just have to start talking.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
