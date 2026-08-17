# r/IndieDev

**Post type:** media post with `media/gameplay.gif`.
**Flair:** usually required — something like "Feedback?" or "Discussion".
**Rules:** https://www.reddit.com/r/IndieDev/about/rules — read before posting.

Dev to dev. Lead with the design decision and what it did to the game. Present it as a decision you
made and stand behind, not a problem you're stuck on — this audience will happily spend forty
comments relitigating a premise if you leave the door open, and that's not what you're after.

---

## Title

I took the accelerator and the fire button out of a shooter to see what the rest of it would have to become

---

## Body

> The idea was to find out what a shooter turns into if the player never chooses when to move or
> when to shoot.
>
> So: the engine runs permanently at a fixed thrust toward the nose. You get a left thruster and a
> right thruster. One of them turns you. Both together brake, but only down to half of maximum
> speed, never to zero. And any thruster also fires, on a fixed cadence, so aiming and turning are
> the same act and you can't line up a shot without also going somewhere.
>
> What that does in practice is make every decision a trade. You can't hold still to shoot, and you
> can't turn away from something without firing into wherever you turned. Friction is low, so your
> old velocity hangs around after you've changed heading, which is where the name came from.
>
> The knock-on effects were the interesting part. Menus had to work on two inputs, so one side moves
> the cursor and both together selects. There's no pause, because there's no button left to put it
> on. Even the phone controller is just two zones.
>
> https://elpatopotato.github.io/myspacedrift/ — browser, free, unfinished.
>
> It's still missing plenty and I'd like general thoughts: what you'd add, what you'd cut, what
> feels off. It's one HTML file with the tuning constants in a block at the top, so most of it is one
> number.

---

## Follow-up comment

Use the canonical follow-up comment from `../POST.md`. This audience will also be interested in the
rendering detail from the r/Gameboy variant, so consider appending a short version.

---

**No score challenge in this variant.** People here came to talk about design, and a leaderboard
pulls the thread sideways.
