# r/IndieDev

**Post type:** media post with `media/gameplay.gif`.
**Flair:** usually required — something like "Feedback?" or "Discussion".
**Rules:** https://www.reddit.com/r/IndieDev/about/rules — read before posting.

Dev to dev. Lead with the design question, not the game. The game is the evidence.

---

## Title

> I removed the accelerator and the fire button from a shooter to see what was left. Two thrusters, and that's it.

---

## Body

> The starting question was whether a shooter still works if the player never chooses when to move or
> when to shoot.
>
> So: the engine is on permanently, at a fixed thrust toward the nose. You get a left thruster and a
> right thruster. One of them turns you. Both together brake — but only down to half of maximum
> speed, never to zero. And any thruster also fires, on a fixed cadence, so aiming and turning are
> the same act and you can't line up a shot without also going somewhere.
>
> What that does in practice is make every decision a trade. You can't hold still to shoot. You can't
> turn to avoid something without also firing into wherever you turned. Friction is low, so your old
> velocity hangs around after you've changed heading, which is where the name came from.
>
> The part I'm unsure about is whether the "you can never stop" rule reads as a constraint people
> enjoy working inside, or just as the game refusing to do what they asked. I can't tell any more —
> I've played it too much.
>
> https://elpatopotato.github.io/myspacedrift/ — free, browser, early build.
>
> Specifically:
>
> - Does the no-full-stop brake feel like a rule or like a bug?
> - Two lives per run. Too few?
> - Should something shoot back, or does that break the two-input idea?
> - Anything in there you'd cut?
>
> Whole thing is one HTML file with the tuning constants in a block at the top, so most of this is one
> number.

---

## Follow-up comment

Use the canonical follow-up comment from `../POST.md`. This audience will also want the rendering
detail from the r/Gameboy variant, so consider appending a short version of it.
