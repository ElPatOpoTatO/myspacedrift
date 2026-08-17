# r/Gameboy

**Post type:** media post with `media/gameplay.gif` or `media/shot-play.png`.
**Rules:** https://www.reddit.com/r/Gameboy/about/rules — read before posting. **Check whether
original projects are allowed at all**; this sub leans towards hardware and collecting, and some
threads only permit physical content.

The one real risk is implying this is a Game Boy game. It isn't, and saying so in the first line is
what keeps the thread friendly. This crowd notices details other people don't, which is why it's
worth asking them specifically.

---

## Title

Not a ROM — a browser game I built to the DMG's constraints, four tones and 59.7275 Hz included

---

## Body

> Up front so nobody wastes a click: this isn't a Game Boy game and it won't run on hardware. It's a
> web game I built to the DMG's rules, and this seemed like the place where people would actually
> notice the details.
>
> The scene isn't drawn with the canvas stroke functions, because antialiasing puts half-tones on
> every edge and half-tones don't exist on that screen. Everything is rasterized by hand — Bresenham
> lines, midpoint circles — into a buffer 144 rows tall, then quantized to four tones. The frame rate
> is capped at 4194304/70224, which is 59.7275 Hz, because without the cap it runs at whatever your
> phone does and stops looking like a handheld.
>
> The tint is a filter rather than a palette: the scene still quantizes to the same four tones and
> the colour is multiplied in at the end, which is what the glass was doing. The audio is square
> waves only, nothing below 380 Hz, and the explosions are fast tone jumps down a scale rather than
> noise, since there's no noise channel to use.
>
> https://elpatopotato.github.io/myspacedrift/ — free, and unfinished.
>
> You play it with two buttons; the engine never stops, so you only steer. If I've got any of the
> above wrong, or something about it reads as fake to you, I'd rather hear it than not — and general
> thoughts on the game are welcome too, since it's still unfinished. If you want to make a contest of
> it, post what you score: the bot on the demo screen averages about 1,500 and managed 3,556 at best.

---

## Follow-up comment

Use the canonical follow-up comment from `../POST.md`, but lead with the easter egg — the tint cycle
is the part this sub will care about most, and the technical explanation is already in the post.
