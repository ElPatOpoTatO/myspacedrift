# Reddit post — My Space Drift

The canonical version. Per-subreddit rewrites live in `variants/`; this is the one they're cut from.
Read `PLAYBOOK.md` before posting — the account rules there matter more than the words here.

Two things this post is not. It isn't an announcement: no feature list, no "free, no install", no
reason why anyone should be impressed. And it isn't a design consultation — **the two thrusters, the
missing fire button and the engine that never stops are settled decisions, not open questions.**
They get stated as what the game is, and the post asks for general feedback on the result.

Links:

- Game: https://elpatopotato.github.io/myspacedrift/
- Source: https://github.com/ElPatOpoTatO/myspacedrift

---

## Titles

Plain, ordered. Say what the game is and that you'd like thoughts on it. Nothing that implies you
suspect it's broken.

1. Made a browser game where you only steer — no accelerator, no fire button. Feedback welcome.
2. Two-thruster arcade game in the browser. The engine never switches off. Would like some thoughts.
3. Small browser game I've been building: you can turn, but you can never stop. Tell me what you think.
4. Been working on a two-button space game. After some general feedback before I add more to it.
5. Browser game where turning is aiming and braking at the same time. Any opinions welcome.
6. My Space Drift — two-thruster arcade game, still unfinished. Would like some feedback.

Keep whichever you pick inside two lines in a browser.

---

## Post body

> I've been building a small browser game and it's reached the point where more eyes would help. It
> works, it just isn't finished, and I'd rather hear what people make of it now than after I've
> added another ten things to it.
>
> It's a rock-dodging game built around one idea: you only steer. There's no accelerator and no fire
> button, on purpose. The engine runs the whole time and all you get is a left thruster and a right
> thruster. Holding both slows you down, but only to half speed, so you can never quite stop — and
> any thruster also fires, so you aim by turning.
>
> Two hits ends a run, and a run lasts about half a minute.
>
> https://elpatopotato.github.io/myspacedrift/
>
> Play a few rounds and tell me what you think — what you'd add, what you'd take out, what you'd
> change. First impressions are useful too, even the vague ones. It's one HTML file with all the
> numbers in a block at the top, so most things are quick to change.
>
> If you end up with a score you're pleased with, post it — a clip if that's easy, a photo of the
> screen if it isn't. The bot that plays the demo screen averages about 1,500 and its best across
> thirteen runs was 3,556, if you want something to measure against.

---

## Follow-up comment

Post this yourself as the first comment. It's the detail that would have made the post too long.

> Some details that didn't fit.
>
> **Controls.** `←` / `→` or `A` / `D` are the two thrusters, and `Space` presses both, which is the
> brake. On a touchscreen it's the left half and right half of the screen. Menus use the same two
> inputs — one side moves, both together selects. There's no third button anywhere in the game, which
> is the whole design rather than something I haven't got round to.
>
> **Two devices, if you have them.** Open it on a laptop or TV and it shows a six-digit code. Put
> `?ctrl` on the end of the same URL on your phone, type the code, and the phone works as the pad.
> It's WebRTC, so both devices need internet but not the same network. This part has had the least
> testing of anything in the game, so if it fails for you I'd like to know what happened.
>
> **The look.** It's built to the Game Boy's limits rather than filtered to look like it — the scene
> gets rasterized by hand into a buffer and quantized to four tones, because antialiasing would put
> half-tones on every edge. The frame rate is pinned to 59.7275 Hz for the same reason. Mentioning
> it in case anyone wonders why it looks the way it does.
>
> **Scores.** There's no server and no global leaderboard; the top ten sits in your own browser. So
> if anyone does post a score, this thread is the only leaderboard there is, and I'm not going to
> audit anyone.
>
> There's also an easter egg on the menu if you get bored.
>
> **Source:** https://github.com/ElPatOpoTatO/myspacedrift — one HTML file, no build step. Every
> number above is in the `CFG` block at the top.

---

## Notes for whoever edits this later

- **Never write the core design as an open question.** No "I can't tell if the controls work", no
  "is that a rule or just annoying", no "should something shoot back". The single-input scheme is
  the game; asking whether it should exist invites a thread arguing about a decision that's already
  made, and it makes the post read as if you don't back your own work.
- The word "on purpose" in the second paragraph is doing real work. It stops the first three replies
  being suggestions to add a fire button.
- The ask is deliberately open — add, remove, change. That's broader than a list of questions and it
  suits a game that's unfinished in a lot of small ways rather than uncertain in one big way.
- Resist adding a feature list. Every line explaining why the game is good is a line that isn't
  asking for anything.
- Don't promise to implement suggestions. "Most things are quick to change" is a claim about the
  codebase and it's true; "I'll add whatever you ask for" isn't.
- Don't add a "known issues" list. Nothing is broken, and inventing faults to sound humble reads
  worse than saying nothing.
- Everything factual is checkable in `index.html`: `brakeFloor: 0.5`, `lives: 2`,
  `cruiseThrust: 210` applied every frame, `gbHz: 4194304/70224`, `gbPalette` with four entries.
- The 1,500 / 3,556 come from `dev/bot-score.mjs` — the demo bot under normal rules. Re-run it after
  any difficulty change. It's the one number here someone might actually check.
