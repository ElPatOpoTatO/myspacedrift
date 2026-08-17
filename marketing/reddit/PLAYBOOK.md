# How to actually post this

Mostly this is about not getting silently removed, and about what to do once replies start arriving.
None of it is about making a post travel further than it deserves to — you're asking people for
their time and their opinion, and the only thing that earns is being straightforward and then
sticking around to answer. Work down it in order.

---

## 1. Check the account first

This is the most likely reason a good post disappears, and it has nothing to do with the writing.

Most game subreddits enforce some version of a **10:1 rule** — roughly one post about your own thing
for every nine where you're taking part in the community. Several also gate on account age and
karma, commonly around **a week old and ~20 karma minimum**, and many cap link posts at **one per
week**. Filters can't tell the difference between asking for feedback and advertising, so a
genuine request gets caught by them just the same.

Before posting anywhere, check:

- [ ] Account is at least a week old
- [ ] Comment karma is comfortably above 20
- [ ] Post history isn't only links to your own things
- [ ] You've commented genuinely in at least a few of the target subs recently

If any of those fail, spend a few days commenting on other people's games first. This isn't a
formality — a fresh account posting a link to its own project is the exact pattern these filters
were built to catch, and the removal is usually silent. You won't be told; the post will just get no
traffic.

---

## 2. Pick the moment

- **Thursday to Saturday, morning.** That's when these subs are busiest.
- **Be free for the hour afterwards.** This is the one that matters. Almost everyone who's going to
  reply does so in the first hour, and a question you answer straight away turns into a
  conversation, while the same question answered a day later turns into nothing. If you can't sit
  with it for an hour, post another day.

---

## 3. Order and spacing

Do not post everywhere at once. The same post appearing in eight subreddits inside an hour is the
most reliable way to get filtered, and several of these subs cap link posts at one a week anyway.

**Round one** — two or three subs, one day:

1. r/DestroyMyGame
2. r/playmygame
3. r/WebGames

Then stop. Read what comes back. If a post got removed, find out why before repeating the mistake
somewhere else. If the feedback contradicts something in the post, fix the post before round two.

**Round two** — a few days later, once you know which framing landed: r/alphaandbetausers,
r/IndieDev, r/tinycode, r/SideProject.

**Round three** — the higher-risk, higher-reach ones, and only if rounds one and two went well:
r/Gameboy, r/retrogaming, r/IndieGaming, plus the weekly threads on r/gamedev and r/webdev.

Before each individual post: **sort that subreddit by top-of-month and look at what actually does
well there.** Match its format. This takes two minutes and is worth more than any rewording.

---

## 4. The media

- `media/gameplay.gif` — the bot playing a real run at level 5. This is the one to attach almost
  everywhere.
- `media/demo-cards.gif` — the in-game DEMO cards explaining the controls, with the thruster strip
  lighting up underneath. Use it where the mechanic is hard to grasp from a still — it explains the
  controls better than any paragraph in the post does.
- `media/shot-menu.png` — the menu with the pairing address and code, which is the clearest way to
  show the phone-as-controller idea without explaining it.
- `media/shot-play.png`, `media/shot-level.png` — two more gameplay stills.
- `media/shot-scores.png` — the high-score table (filled with placeholder names by the capture
  script, not real scores).

Upload the GIF natively where the subreddit allows it rather than linking out. Native media gets an
inline preview; a link gets scrolled past.

---

## 5. In the comments

Reply to everything in the first hour, briefly. Humility outperforms polish here — the post is a
request for criticism, so treat every piece of criticism as the thing you asked for.

Predictable comments, and honest answers to them:

**"The controls are frustrating / I can't stop."**
That's the design, and it's also the open question. Say so, and ask them whether it stayed
frustrating or turned into something they got used to. That distinction is the single most useful
thing you can learn from this whole exercise.

**"It's just Asteroids."**
It shares the rock field. What's different is that there's no thrust button and no fire button — the
engine is always on and any thruster fires, so steering is the whole interface. Say it plainly and
don't get defensive; it's a fair first impression.

**"Two lives is too few."**
Take the note. It's `CFG.lives` and it's one number.

**"Why is there no licence?"**
Currently true — the repo has no LICENSE file, which by default means all rights reserved. Either
add one before posting or answer honestly that you haven't picked one yet.

**"It doesn't work on my phone."**
Ask for the browser and whether the screen was in landscape. The game locks to landscape and shows a
rotate prompt, which people sometimes read as a freeze.

**"I can't read the pairing URL."**
This used to be real — the line was 281 LCD dots wide and a 16:9 screen is only 256 across, so it
was clipped at both ends on every normal TV and laptop. It's fixed: the address now wraps onto two
lines when it doesn't fit, and `dev/layout-test.mjs` checks it at five screen shapes. If someone
still reports it, ask for their screen size, because that would be a new case.

**Do not** reply to a suggestion with a promise to implement it. "That's a small change, I'll try
it" is honest. "I'll add that" isn't, until it's added.

---

## 6. Running the score challenge

The post asks people to reply with their best score, ideally with a clip. The reason it's worth
including is that one run tells someone almost nothing about the controls — the whole question you're
asking is whether the drift becomes something you can work with, and that only happens after a few
goes. A score to chase is the simplest way to get people to play long enough to have a real opinion.

It only works if you actually run it:

- **Keep a table in the post itself**, not buried in a comment. Edit the post as entries come in.
  Three columns is enough: name, score, and whether there's a clip. People check whether they're
  still on it.
- **Reply to every entry.** Even one line. An unanswered score post is the last one that person
  files.
- **Ask for a clip, accept a photo.** Recording a browser game is more friction than most people
  will accept, and a photo of the screen still shows the score. Treat the clip as the thing that
  earns the top of the table, not as the price of entry.
- **Say what you'd do about an obviously fake score: nothing.** The high-score table is stored
  locally and signed against the device's pairing code, so there's no server to cheat and nothing
  to protect. If someone posts a number they didn't earn, they've won a listing on a Reddit table.
  Arguing about it costs you more than the entry is worth.
- **Post your own score first**, in the follow-up comment. Nobody wants to be the first entry, and
  a number in the thread from the start sets the scale.

The subreddits where this takes off are the ones whose audience came to play: r/WebGames,
r/playmygame, r/IndieGaming, r/alphaandbetausers, and r/Gameboy and r/retrogaming — score-chasing is
native to those last two. It falls flat in r/gamedev, r/IndieDev and r/DestroyMyGame, where people
turned up to critique rather than compete, so the variants for those subs leave it out.

The number to quote comes from `dev/bot-score.mjs`, which runs the demo bot under normal rules — two
lives, no help — and reports the spread. As measured: 13 runs, median 1,433, mean 1,531, best 3,556,
each run lasting a bit over half a minute. Re-run it if you change the difficulty, because a stale
target is worse than no target.

## 7. Afterwards

If a suggestion from a thread ships, go back to that thread and say so. It costs one comment, and
it's the difference between people who commented once and people who come back to see what changed.
