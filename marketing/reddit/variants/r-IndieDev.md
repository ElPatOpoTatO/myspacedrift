# r/IndieDev

**Post type:** media post with `media/gameplay.gif`.
**Flair:** usually required — something like "Feedback?" or "Discussion".
**Rules:** https://www.reddit.com/r/IndieDev/about/rules — read before posting.

Dev to dev. Lead with the design problem you're stuck on. The game is the evidence, not the point.

---

## Title

I took the accelerator and the fire button out of a shooter and I can't tell if what's left works

---

## Body

> The question I started with was whether a shooter still works if the player never chooses when to
> move or when to shoot.
>
> So: the engine runs permanently at a fixed thrust toward the nose. You get a left thruster and a
> right thruster. One of them turns you. Both together brake, but only down to half of maximum
> speed, never to zero. And any thruster also fires, on a fixed cadence, so aiming and turning are
> the same act and you can't line up a shot without also going somewhere.
>
> In practice that makes every decision a trade. You can't hold still to shoot, and you can't turn
> away from something without firing into wherever you turned. Friction is low, so your old velocity
> hangs around after you've changed heading.
>
> What I can't judge any more is whether the "you can never stop" rule reads as a constraint people
> enjoy working inside, or just as the game refusing to do what they asked. I've played it far too
> much to have an opinion worth anything.
>
> https://elpatopotato.github.io/myspacedrift/ — browser, free, unfinished.
>
> - Does the no-full-stop brake feel like a rule or like a bug?
> - Two lives per run. Too few?
> - Should something shoot back, or does that break the two-input idea?
> - Anything in there you'd cut?
>
> It's one HTML file with the tuning constants in a block at the top, so most of this is one number.

---

## Follow-up comment

Use the canonical follow-up comment from `../POST.md`. This audience will also be interested in the
rendering detail from the r/Gameboy variant, so consider appending a short version.

---

**No score challenge in this variant.** People here came to talk about design, and a leaderboard
pulls the thread away from the questions you're actually asking.
