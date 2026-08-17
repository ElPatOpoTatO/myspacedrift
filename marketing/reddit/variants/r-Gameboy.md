# r/Gameboy

**Post type:** media post with `media/gameplay.gif` or `media/shot-play.png`.
**Rules:** https://www.reddit.com/r/Gameboy/about/rules — read before posting. **Check whether
original projects are allowed at all**; this sub leans heavily towards hardware and collecting, and
some threads only permit physical content.

The one real risk here is implying this is a Game Boy game. It isn't, it's a web game built to the
DMG's constraints, and saying so in the first line is what keeps the thread friendly. This crowd
will notice details nobody else does, so the technical honesty is the pitch.

---

## Title

> Not a ROM — a browser game built to the DMG's actual constraints. Four tones, no half-tones, locked to 59.7275 Hz.

---

## Body

> Up front so nobody wastes a click: this isn't a Game Boy game and it won't run on hardware. It's a
> web game I built to the DMG's rules, and the rules turned out to be the interesting part.
>
> The scene isn't drawn with the canvas stroke functions, because antialiasing puts half-tones on
> every edge and half-tones don't exist on that screen. Everything gets rasterized by hand — Bresenham
> lines, midpoint circles — into an intensity buffer exactly 144 rows tall, then quantized to four
> tones. The dot grid goes on afterwards in a shader.
>
> The frame rate is capped at 4194304/70224, which is 59.7275 Hz. Without the cap it runs at whatever
> your phone does, and at 120 Hz it stops looking like a handheld and starts looking like video.
>
> The tint is a filter, not a palette. The scene still quantizes to the same four tones and the colour
> gets multiplied in at the end, which is what the glass was doing. There are eight of them — the
> green one is the point, the rest are colours no handheld ever shipped with and I put them in anyway.
>
> The audio is square waves only, nothing below 380 Hz, rectangular envelopes, no noise channel — the
> explosions are just fast tone jumps down a pentatonic scale, the way a cheap piezo buzzer would
> have faked them.
>
> https://elpatopotato.github.io/myspacedrift/
>
> It's free and unfinished. You play it with two buttons: the engine never stops, so you only steer.

---

## Follow-up comment

Use the canonical follow-up comment from `../POST.md`, but lead with the easter egg section — the
tint is the part this sub will care about most.
