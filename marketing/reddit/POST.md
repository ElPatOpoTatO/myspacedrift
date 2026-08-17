# Reddit post — My Space Drift

The canonical version. Per-subreddit rewrites live in `variants/`; this is the one they're cut from.
Read `PLAYBOOK.md` before posting — the account rules there matter more than the words here.

This is a request for feedback, not an announcement. The difference shows up in what gets left out:
no feature list, no "free, no install", no reason why anyone should be impressed. Someone reading it
should come away knowing what they'd be testing and what's being asked of them, and nothing else.

Links:

- Game: https://elpatopotato.github.io/myspacedrift/
- Source: https://github.com/ElPatOpoTatO/myspacedrift

---

## Titles

Plain, ordered. Say what you're asking for. A title written to get clicks sets up a post that then
has to live up to it.

1. Made a browser game with no accelerator and no fire button. I can't tell if the controls work.
2. I can't tell whether my game's main idea is a good constraint or just annoying
3. Two-thruster space game, unfinished. Looking for people to tell me what's wrong with it.
4. You can't stop in my game, only turn. Is that a rule or a problem?
5. Small browser game I've been working on — would like some opinions on the controls before I add more
6. Asking for feedback on a two-button arcade game where the engine never switches off

Keep whichever you pick inside two lines in a browser.

---

## Post body

> I've been building a small browser game and I've reached the point where I can't tell if it's any
> good. It works, it just isn't finished, and I'd rather find out what's wrong with it now than keep
> adding to something that doesn't hold up.
>
> It's a rock-dodging game with an odd control scheme, and the control scheme is the part I'm least
> sure about. There's no accelerator and no fire button. The engine runs the whole time, and you get
> a left thruster and a right thruster. Holding both slows you down, but only to half speed, so you
> can't actually stop. Any thruster also fires, which means you aim by turning.
>
> Two hits ends a run, and a run lasts about half a minute.
>
> https://elpatopotato.github.io/myspacedrift/
>
> What I'd like to know:
>
> - Does never being able to fully stop feel like a rule you can work with, or just irritating?
> - Two lives per run. Too few?
> - Should something shoot back, or would that spoil the two-button idea?
> - Anything in there you'd take out?
>
> Anything else you notice is welcome too, including if the whole premise is wrong. It's one HTML
> file with all the numbers in a block at the top, so most of this is quick to change.
>
> If you play a few rounds and end up with a score you're pleased with, post it — a clip if that's
> easy, a photo of the screen if it isn't. The bot that plays the demo screen averages about 1,500
> and its best across thirteen runs was 3,556, if you want something to measure against.

---

## Follow-up comment

Post this yourself as the first comment. It's the detail that would have made the post too long,
not a second pitch.

> Some details that didn't fit.
>
> **Controls.** `←` / `→` or `A` / `D` are the two thrusters, and `Space` presses both, which is the
> brake. On a touchscreen it's the left half and right half of the screen. Menus use the same two
> inputs — one side moves, both together selects. There's no third button anywhere.
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

- The four questions are the post. If length has to come out of somewhere, cut a description
  paragraph, not a question.
- Resist adding a feature list. Every line that explains why the game is good is a line that isn't
  asking for anything, and this post only works if it reads like a person who's stuck.
- Don't promise to implement suggestions. "Most of this is quick to change" is a claim about the
  codebase and it's true; "I'll add whatever you ask for" isn't.
- Don't add a "known issues" list. Nothing is broken, and inventing faults to sound humble reads
  worse than saying nothing.
- Everything factual is checkable in `index.html`: `brakeFloor: 0.5`, `lives: 2`,
  `cruiseThrust: 210` applied every frame, `gbHz: 4194304/70224`, `gbPalette` with four entries.
- The 1,500 / 3,556 come from `dev/bot-score.mjs` — the demo bot under normal rules. Re-run it after
  any difficulty change. It's the one number here someone might actually check.
