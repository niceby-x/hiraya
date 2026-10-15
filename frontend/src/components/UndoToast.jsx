// Bottom-of-screen message with an optional action (for example Undo).
// The live region is always mounted so screen readers announce each new message.
// It stays until dismissed: undo should not disappear on a timer.
export default function UndoToast({ toast, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-center"
    >
      {toast && (
        <div className="pointer-events-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-brand/40 bg-panel p-3.5 text-sm shadow-2xl">
          <p className="min-w-0 flex-1 font-medium text-ink">{toast.message}</p>
          {toast.actionLabel && (
            <button
              type="button"
              onClick={toast.onAction}
              className="shrink-0 rounded-lg bg-brand px-3.5 py-1.5 text-sm font-bold text-on-brand cursor-pointer hover:opacity-90"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted cursor-pointer hover:border-brand hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
