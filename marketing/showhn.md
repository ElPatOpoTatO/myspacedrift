# Show HN — My Space Drift

**This is the one you can post today.** Hacker News has no karma minimum for submitting; karma only
gates downvoting, at 50. Nothing here needs an account you don't have.

The game fits the Show HN rules unusually well. From https://news.ycombinator.com/showhn.html:

> Show HN is for something you've made that other people can play with.

> Please make it easy for users to try your thing out, ideally without barriers such as signups or
> emails.

A URL that plays instantly, no account, no install, is close to the ideal case. What's off topic
there — "blog posts, sign-up pages, newsletters, lists, and other reading material" — is none of
what you have. Early-stage is explicitly fine, as long as it works, and it does.

Two rules that kill Show HN posts, so don't break them:

- **Don't ask anyone to upvote.** The guidelines say it plainly: "Please don't ask friends to upvote
  or comment. That's not ok on HN." It's also detectable and it's the fastest way to get the post
  killed.
- **Be at the keyboard.** The guidelines expect you to be around to discuss it. On HN the author
  answering questions in the thread is most of what makes a Show HN work at all — more than the post
  text.

Post on a weekday morning, US time.

---

## Titles

HN clicks on the technical hook, not the game. Lead with the thing that's unusual to build, not the
thing that's fun to play. Keep it short and don't editorialise — HN dislikes hype in titles.

1. Show HN: A browser game rendered by a hand-written Game Boy LCD rasterizer
2. Show HN: Two-button space game where your phone pairs to the tab as the gamepad
3. Show HN: My Space Drift – a single-file browser game, no build step, four tones
4. Show HN: I capped my game at 59.7275 Hz to make it feel like a handheld
5. Show HN: An arcade game with no accelerator and no fire button

---

## Post body

Show HN posts can be a URL with the detail in your own first comment, or a text post. The URL form
usually does better. Submit the game link with title #1 or #2, then post this immediately as the
first comment.

> Author here. It's a rock-dodging arcade game that runs in a browser tab — free, no signup, works on
> desktop or phone.
>
> The part that took the longest isn't the game, it's the screen. It's not a CRT-style filter over
> normal canvas drawing: nothing is drawn with the canvas stroke functions at all, because
> antialiasing puts half-tones on every edge and a Game Boy has exactly four tones. Everything is
> rasterized by hand — Bresenham for lines, midpoint for circles — into a Float32 intensity buffer
> exactly 144 rows tall, then quantized to those four values, and a WebGL pass adds the dot grid and
> tints it. The tint is a multiply at the end rather than a palette swap, which is what the glass
> was actually doing.
>
> The frame rate is pinned to 4194304/70224 Hz — 59.7275 — because on a 120 Hz phone the extra
> smoothness makes it read as video instead of a handheld. The simulation clock is separate, so the
> cap costs nothing but the look.
>
> Audio is synthesized in the browser with no files: square waves only, nothing below 380 Hz, and
> the explosions are fast tone jumps down a pentatonic scale rather than noise, because a piezo
> buzzer has no noise channel to use.
>
> The controls are the design rather than an omission. There's no accelerator, because the engine
> never switches off, and no fire button, because any thruster fires. You get a left thruster and a
> right thruster. Holding both brakes you to half speed and no further, so you can't stop. Aiming is
> turning.
>
> One more thing that might interest people here: open it on a laptop or TV and it shows a six-digit
> code. Put `?ctrl` on the end of the same URL on your phone, type the code, and the phone becomes
> the two-button pad over WebRTC — PeerJS for the handshake, then peer-to-peer, so the two devices
> need internet but not the same network. The screen releases both thrusters by itself if the phone
> goes quiet for a second, so a dropped connection doesn't leave the engine stuck on.
>
> It's one HTML file, about 3,200 lines, no build step, no package.json, and one CDN dependency
> (PeerJS) that only the pairing uses. Source: https://github.com/ElPatOpoTatO/myspacedrift
>
> It's unfinished and I'd like to hear what's wrong with it.

---

## If you submit as a text post instead

Use the same body, but put the game URL on its own line near the top rather than in the title field,
and open with one sentence saying what it is before the technical detail. Text posts get less
traffic on Show HN, so prefer the URL form.

---

## Answering comments

HN will ask sharper questions than Reddit. The honest answers:

**"Why not just use canvas with imageSmoothingEnabled = false?"**
That fixes scaling, not antialiasing of the primitives themselves — a stroked line still lands
half-lit pixels on the edges, and half-tones are exactly what a four-tone panel can't have. The
buffer approach makes quantization the last step instead of fighting it.

**"Why a Float32Array and not Uint8?"**
Intensities accumulate before quantization; keeping them continuous until the final step is what
lets overlapping strokes composite by maximum without banding early.

**"Isn't 59.7275 Hz unachievable with requestAnimationFrame?"**
You can't hit it exactly. It picks the nearest divisor of the display's rate — on 60/120/240 it
lands on 60, on 144 it takes the nearest divisor. `CFG.gbHz = 0` disables the cap.

**"Why PeerJS instead of raw WebRTC?"**
Only for the signalling handshake, which otherwise needs a server. After that it's plain WebRTC. It
is the one dependency and it's the one I'd most like to remove.

**"It's Asteroids."**
It shares the rock field. What's different is that there's no thrust and no fire input, so steering
is the entire interface. It's a fair first impression and not worth arguing about.

**Never** reply to a suggestion with a promise to implement it. "That's a small change, I'll try it"
is honest; "I'll add that" isn't, until it's added.
