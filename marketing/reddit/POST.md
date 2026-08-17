# Reddit post — My Space Drift

The canonical version. Per-subreddit rewrites live in `variants/`; this is the one they're cut
from. Read `PLAYBOOK.md` before posting anything — the account gate there matters more than the
words here.

Framing: early build, looking for playtesters. Not a launch.

Links used throughout:

- Game: https://elpatopotato.github.io/myspacedrift/
- Source: https://github.com/ElPatOpoTatO/myspacedrift

---

## Titles

Ordered. Pick by subreddit rather than reusing one everywhere. Each names something to argue with,
because the argument is the feedback — a title that just announces the game gives nobody a reason
to type.

1. You can't stop. You can only turn. Two-button browser game, unfinished, looking for people to break it.
2. My game has no accelerator and no fire button — you get a left thruster and a right thruster and that's all
3. The engine never stops and the brake only slows you to half speed. Good constraint or just annoying?
4. Two-button space game where turning is also aiming. Early build, tell me what to cut.
5. Browser game that pairs your phone to the tab as a two-button gamepad. Free, unfinished, want feedback.
6. I made an arcade game that quantizes to the Game Boy's four tones and locks to 59.7275 Hz
7. Free browser game, no install, no accounts. Two buttons total. Would like some honest opinions.
8. Early build of a Game Boy–looking asteroid game. Phone becomes the controller, no app needed.

Keep whichever you pick inside two lines in a browser. Three is already too long.

---

## Post body

> My Space Drift. Free, runs in a browser. It isn't finished, which is why I'm posting it now
> instead of later — I'd rather find out what's worth building before I build the wrong thing.
>
> The ship has no accelerator and no fire button. The engine is on permanently. You get a left
> thruster and a right thruster and nothing else. Holding both brakes, but only down to half speed,
> so you can never actually stop. People find that upsetting. Any thruster also fires, which means
> you aim by turning.
>
> Two hits ends the run. There's no lives counter — after the first hit the ship starts losing
> pieces of its own outline, and that's the only warning you get.
>
> Open it on a laptop or a TV and it shows a six-digit code. Put `?ctrl` on the end of that same URL
> on your phone, type the code in, and the phone becomes the two-button pad. It runs over WebRTC, so
> the two devices don't have to be on the same wifi.
>
> The Game Boy part isn't a filter. The scene gets rasterized by hand into a buffer and quantized to
> four tones, because canvas antialiasing kept sneaking half-tones in. Frame rate is pinned to
> 59.7275 Hz, which is what the real DMG ran at.
>
> https://elpatopotato.github.io/myspacedrift/
>
> Things I actually want to know:
>
> - Never being able to fully stop: good constraint, or just annoying?
> - Two lives per run. Too few?
> - Should something shoot back, or does that ruin the two-button idea?
> - Anything in there you'd take out?
>
> And if you'd rather compete than critique: reply with your best score. A clip beats a screenshot,
> mostly because I want to see how you got it. For something to aim at — the machine that plays the
> DEMO screen averages about 1,500, and its best across thirteen runs was 3,556. Runs are short, so
> that's a smaller ask than it sounds.
>
> It's one HTML file with a config block at the top, so most of this is a small change rather than a
> rewrite. Tell me what's wrong with it and there's a decent chance it's different by next week.

---

## Follow-up comment

Post this yourself as the first comment, immediately after the post goes up. It holds everything
that would have made the post too long to read.

> A few things that didn't fit up there.
>
> **Controls**
>
> - Desktop: `←` / `→` or `A` / `D` are the two thrusters. `Space` presses both, which is the brake.
>   `T` cycles the screen tint.
> - Touch: left half of the screen is the left thruster, right half is the right one. Both thumbs to
>   brake.
> - Menus use the same two inputs — one side moves the cursor, both together selects. There is no
>   third button anywhere in the game.
>
> **Phone as the controller**
>
> 1. Open the game on the big screen. A six-digit code appears under the menu.
> 2. Open the same URL on your phone with `?ctrl` on the end.
> 3. Type the code. The phone becomes a two-zone pad, left and right.
>
> PeerJS handles the handshake and everything after that is WebRTC, so both devices need internet
> but not the same network. The code survives a reload. If the phone goes quiet for a second the
> screen releases both thrusters by itself, so a dropped connection doesn't leave the engine stuck
> on.
>
> **There's an easter egg**
>
> Tap the title on the menu four times, no more than three seconds apart. It tints the glass — green,
> amber, red, and a few more. It isn't a palette swap: the scene is still quantized to the same four
> tones and the colour gets multiplied in at the end, in the shader, which is what the console's
> glass actually did. Once you've found it once, a single tap is enough from then on.
>
> **About the scores**
>
> There's no server and no global leaderboard — the top ten is stored in your own browser, signed
> against your pairing code, so it never leaves your device. Which means this thread is the
> leaderboard. Post a photo of the screen if recording is a hassle; I'm not going to audit anyone.
>
> The 3,556 I mentioned is the demo bot's best across thirteen runs under normal rules, two lives
> and no help. Its median run is about 1,400 and lasts a little over half a minute, so beating it
> is less work than the number makes it look.
>
> **Source**
>
> https://github.com/ElPatOpoTatO/myspacedrift — one HTML file, no build step, no dependencies
> except PeerJS for the pairing. Every number I mentioned lives in a `CFG` block at the top if you
> want to see what's behind any of it.

---

## Notes for whoever edits this later

- Don't add a "known issues" list. Nothing in the build is broken, and inventing problems to sound
  humble reads worse than saying nothing.
- Don't promise to implement suggestions. "There's a decent chance it's different by next week" is a
  claim about how small the codebase is, and it's true. "I'll add whatever you ask for" isn't.
- The four questions at the end are the point of the post. If length has to come out of somewhere,
  cut a hook paragraph, not the questions.
- Everything factual here is checkable in `index.html`: `brakeFloor: 0.5`, `lives: 2`,
  `cruiseThrust: 210` applied every frame, `tintTaps: 4` with `tintTapWindow: 3.0`,
  `gbHz: 4194304/70224`, `gbPalette` with four entries. If you change the game, change this too.
- The 1,500 / 3,556 in the score challenge come from `dev/bot-score.mjs` — the demo bot playing
  under normal rules. Re-run it after any difficulty change; quoting a target the game no longer
  produces is the one factual error here that people will actually catch.
