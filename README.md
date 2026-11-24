# Houseplant Out-of-Office — "The Houseplant Out-of-Office" (make.fun)

A deterministic houseplant out-of-office writer. It scores a pool of
original out-of-office auto-replies, written as if a houseplant sent them,
against a rubric mirroring the judge's brief — plant out-of-office voice,
a fresh surprising joke, the plant's own life (water, roots, sunlight,
long stretches of being ignored) driving the joke, tight wording inside
120 characters, and originality — and writes the winner to
`$MAKEFUN_OUTPUT_DIR/entry.txt`.

## What it does

`main.ts` (Node 22, zero dependencies, no network) scores a pool of 26
hand-written original lines — 22 pass validation (one ends in a question
mark, three have no plant-life word at all) — and picks the winner by
score, then shortest, then lexicographic. Every candidate is validated
first: one line, 1–120 characters, an out-of-office opener, a concrete
plant-life word in it. The scorer rewards the out-of-office shape, specific
plant-life words (roots, pot, sunlight, leaves, water), a sting in the
turn ("plant for 'I have read your email and I disagree'", "nothing down
there but more pot", "running on spite and indirect light"), and short
economical lines; it penalises worn-out closes ("please water me"), the
flooded angles named in the brief (the fern ignored since March, the
unbothered cactus, the monstera with opinions about the window) and the
photosynthesis pun.

The winning line (109 characters):

> I am out of office. My leaves are turning yellow, which is plant for 'I have read your email and I disagree.'

## Run it locally

```sh
MAKEFUN_OUTPUT_DIR=/tmp/houseplant-out node main.ts
cat /tmp/houseplant-out/entry.txt
```

Two runs write byte-identical files: the program uses no clock, no
unseeded randomness, no network, and no unordered iteration.

## How the line is chosen

- **Setup** is the plant's own life: leaves turning yellow, the one
  signal every plant owner recognises and dreads.
- **Pivot** lands in the final clause: yellow leaves are plant for
  having read the email and disagreeing with it — the plant is not
  dying, it is objecting.
- **Economy**: 109 characters, every word earning its place, nothing
  there to explain the joke.
- The scorer ranked the roots line next (38 points) and the delegated-
  to-the-spider-plant line after it (36); the leaves line won on the
  plant-life count plus the sharp "I disagree" sting.
