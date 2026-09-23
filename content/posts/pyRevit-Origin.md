+++ 
date = 2026-09-24
draft = false 
title = 'pyRevit Origin' 
[params]
  author = 'Jean-Marc Couffin'
+++ 

> This piece is the result of an interview with Ehsan Iran-Nejad, the creator of pyrevit, at Autodesk University 2026 in Vegas on the 17th of September, 2026

# A Revit Scripting Journey: From Secret Python Scripts to PyRevit

It started in 2013 with a move from Houston to Portland - and a slightly optimistic answer in a job interview.

“Do you know Revit?”

“Yes.”

Technically, that wasn’t entirely true. There had been some exposure to it, but not enough to confidently claim real experience. Still, the mindset was simple: software can be learned. With one week before starting the new role, the basics of Revit came together through Paul Aubin’s YouTube tutorials.

Once on the job, the real problem became clear.

The work involved senior living facilities, where layouts, unit sizes, and criteria had to be checked repeatedly. Every design change meant returning to spreadsheets, entering numbers, and manually verifying whether the project still worked. The existing workflows relied on detailed Excel cheat sheets. It was functional, but painfully repetitive.

That was the moment Revit scripting entered the picture.

## Discovering Revit Python Shell

Coming from AutoCAD and already knowing Python, the natural question was: can Python run inside Revit?

The answer came through Revit Python Shell. It was installed quietly on the work machine, and soon small scripts were handling the repetitive calculations that previously took around 20 minutes.

A manager could ask for a change and a number, and the answer could come back almost immediately after running a script.

At first, there was understandable skepticism. People wanted to know whether the results could be trusted. So the scripts had to be explained: what they did, what data they used, and why the output was correct.

But the value was obvious. Automation was not just a technical curiosity - it saved real time.

## Turning Scripts into Tools

Soon, a folder full of individual Python files became its own problem. Opening Revit Python Shell, loading a script, running it, and reading the output was still too slow for tools used every day.

The next step was to look inside Revit Python Shell itself, borrow the Python.NET execution approach, and build a startup script that loaded custom tools directly into the Revit interface.

Each button had a monster script/icon. Each monster had its own specialty: sheets, views, and other everyday Revit tasks. The approach was partly inspired by Pixar’s RenderMan, where individual characters represented different parts of the system.

By late 2014, the project went onto GitHub - initially as a way to learn Git and GitHub.

That was also when **Gui Talarico** found it.

Gui, a software engineer, pointed out a very fair issue: putting a thousand lines of code into one script made it hard to maintain. That feedback became the push to reorganize and rewrite the project properly.

PyRevit was ultimately rewritten from scratch four times. Version 4 became the big cleanup phase, with more consistent forms, APIs, and shared patterns across tools.

## From Internal Automation to a Community Tool

At first, PyRevit was an internal tool. A small group of advanced Revit users at LRS Architects got access to it, and usage was tracked to understand its impact.

The team estimated how much time each tool saved. A few minutes here, five minutes there - it added up. That data helped make the case to management that automation could have a meaningful impact on project delivery.

One of the biggest early milestones was Pattern Maker.

The interior design team needed custom patterns but had limited access to an existing commercial tool. So a new solution was built from scratch, working backward from Revit pattern files and using vector math to generate the results.

It did not solve every possible edge case perfectly. Sometimes the lines had to be “wiggled” slightly to fit the grid. But it worked - and interior designers loved it. Their elevations became more detailed, easier to manage, and visually stronger.

That was when PyRevit began to feel like more than a personal toolkit.

## The Moment It Went Global

Then came the emails.

Foster + Partners reached out with questions about deploying PyRevit in a larger environment. Later came interest from practices including Zaha Hadid and Heatherwick.

For someone who had once wanted to work at those firms as an architect, suddenly getting emails from them because of a Revit tool felt surreal. Tools became a gateway to conversations that architecture alone had never opened.

PyRevit grew through contributions from a small group of early collaborators, including Gui Talarico and Cyril Waechter on the MEP side. It also grew through a modular extension model: a tool could live in its own folder, bring its own dependencies, and disappear cleanly without breaking the rest of the interface.

## Sustainability Is Still the Hard Part

Today, PyRevit has a large community and is used in many high-profile architecture practices. But open-source success brings its own challenges.

The biggest issue is not only writing code. It is communication: GitHub issues, forum discussions, LinkedIn messages, emails, feature requests, bug reports, and questions from firms trying to deploy it at scale.

There is also the question of funding. Corporate donations have been limited, while infrastructure and contributor support still need to be covered. A steady income - even something like $500 per month - could make a real difference by rewarding the people doing the most work.

There are also bigger questions ahead:

- Could PyRevit support a proper extension marketplace?
- How can extensions be reviewed without creating a bottleneck?
- Can usage data help make a stronger funding case to Autodesk or major firms?
- Could AI-assisted bug fixing and automated UI testing reduce maintenance work?

None of those questions have simple answers. But that has always been part of the PyRevit story: build something useful, learn what breaks, rewrite it better, and keep going.

The project began because repetitive work was frustrating. It grew because people needed better tools. And it continues because a global community has shown that small automations can have a huge impact.
