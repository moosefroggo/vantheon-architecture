export function formatDraftLabel(label: string) {
  return label.replace(/^Draft\s+(V\d+)$/i, "Drafting $1")
}

export function formatCheckpointLabel(checkpoint: string) {
  const match = /^V\d+\.(\d+)$/.exec(checkpoint.trim())
  return match ? `Checkpoint ${Number(match[1])}` : checkpoint
}

export function formatPaperLabel(label: string) {
  return /^Paper\s+V\d+$/i.test(label.trim()) ? "Paper" : label
}

export function formatVersionReference(reference: string) {
  return reference
    .replace(/Draft\s+(V\d+)/gi, "Drafting $1")
    .replace(/checkpoint\s+V\d+\.(\d+)/gi, (_, checkpoint: string) =>
      `Checkpoint ${Number(checkpoint)}`
    )
}
