# itch.io page — My Space Drift

Free to publish, no karma or reputation gate, and it gives the game a real home you can link to from
everywhere else. Do this one even if you do nothing else: every other post gets better when there's
a proper page behind the link.

---

## Uploading the build

The game is already a static site, so the build is a zip of what's in the repo root. **`index.html`
must be at the top level of the zip, not inside a folder** — that's the single most common upload
mistake.

```sh
zip -j myspacedrift.zip index.html sw.js manifest.webmanifest icon-180.png icon-192.png icon-512.png icon-maskable-512.png
```

Seven files, a few hundred KB. The limits are 200 MB per file, 500 MB total and 1000 files, so
there's nothing to worry about. Don't include `dev/`, `tools/`, `media/` or `marketing/`.

Page settings:

- **Kind of project:** HTML
- Tick **"This file will be played in the browser"** on the uploaded zip
- **Viewport:** 960 × 540. The game fills whatever container it gets, so this is a starting size
  rather than a native resolution; it just needs to be landscape.
- **Tick "Fullscreen button"** — the game is landscape-locked and much better full screen
- **Mobile friendly:** yes, and set orientation to landscape
- **Cover image:** `media/cover-630x500.png` (itch wants 630 × 500; the minimum is 315 × 250)
- **Screenshots:** `media/shot-play.png`, `media/shot-menu.png`, `media/shot-scores.png`, and
  `media/gameplay.gif` — animated GIFs work as screenshots and are worth including
- **Pricing:** No payments (or "free, donations accepted" if you want)

**One thing to expect, so it doesn't look like a bug:** itch serves HTML5 games in a sandboxed iframe
on a separate subdomain. The service worker may not register there, so offline play — the one thing
`sw.js` provides — may not work on itch. The game itself is unaffected, and so are `localStorage`
scores and the phone pairing. The GitHub Pages version keeps working offline as normal.

---

## Title and tagline

**Title:** My Space Drift

**Tagline** (short description, shows under the title and on the card):

> Two thrusters, no accelerator, no fire button. The engine never stops and you can never quite stop
> either.

---

## Tags

Keep these lowercase and don't over-tag; itch ranks badly-tagged pages poorly.

`arcade`, `gameboy`, `retro`, `pixel-art`, `space`, `singleplayer`, `html5`, `score-attack`,
`asteroids`, `minimalist`

Under **Classification** pick *Game*, under **Genre** pick *Action*, and set **Average session** to
*A few minutes*, which is true — a run lasts about half a minute.

---

## Page description

> You get a left thruster and a right thruster. That's the whole control scheme.
>
> There's no accelerator, because the engine never switches off. There's no fire button, because any
> thruster fires. Holding both slows you down but only to half speed, so stopping isn't something
> the game lets you do. Aiming happens by turning, which means you can't line up a shot without also
> going somewhere.
>
> Two hits ends a run. There's no lives counter — after the first hit the ship starts losing pieces
> of its own outline, and that's the only warning you get.
>
> **Your phone can be the controller.** Open the game on a laptop or TV and it shows a six-digit
> code. Open the same page on your phone with `?ctrl` on the end, type the code in, and the phone
> becomes the two-button pad. It runs over WebRTC, so both devices need internet but not the same
> wifi.
>
> **The Game Boy look isn't a filter.** The scene is rasterized by hand into a buffer 144 rows tall
> and quantized to four tones, because canvas antialiasing would put half-tones on every edge and
> that screen didn't have any. The frame rate is pinned to 59.7275 Hz, which is what the original
> ran at. The sound is square waves only, synthesized in the browser, with no recorded files at all.
>
> It's unfinished and I'd like to know what you'd add, remove or change.
>
> ---
>
> **Controls**
>
> - Keyboard: `←` / `→` or `A` / `D` for the two thrusters, `Space` for both at once (the brake)
> - Touch: left half of the screen, right half of the screen, or both
> - Menus use the same two inputs — one side moves, both together selects
>
> There's an easter egg on the menu.
>
> Source: https://github.com/ElPatOpoTatO/myspacedrift — one HTML file, no build step.

---

## First devlog post

itch devlogs show up in the feeds of people following the tags, so it's worth posting one rather
than leaving the page bare.

**Title:** Why this game has no fire button

> The starting question was whether a shooter still works if the player never chooses when to move
> or when to shoot.
>
> The engine runs permanently at a fixed thrust toward the nose. You get two thrusters. One turns
> you. Both together brake — but only to half of maximum speed, never to zero. And any thruster also
> fires, so aiming and turning are the same act.
>
> What that does is make every decision a trade. You can't hold still to shoot, and you can't turn
> away from something without firing into wherever you turned. Friction is low, so your old velocity
> hangs around after you've changed heading, which is where the name came from.
>
> The knock-on effects were the interesting part. Menus had to work on two inputs, so one side moves
> the cursor and both together selects. There's no pause, because there's no button left to put it
> on. Even the phone controller is just two zones with no labels.
>
> It's unfinished, and what I'd most like right now is to hear what's missing. Comments are open.

---

## After it's up

- Put the itch link in the GitHub repo description and the README.
- Use the itch page as the link in the Reddit posts when you get to them — it carries screenshots and
  a description that a bare GitHub Pages URL doesn't.
- itch has its own community forums (Release Announcements, and the boards for feedback). Posting
  there is free and ungated, and it's the natural next step after the page exists.
