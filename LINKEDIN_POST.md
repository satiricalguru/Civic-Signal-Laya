# Suggested LinkedIn post

What if a public-service request could be understood in the language it was written — and every recommendation stayed transparent to a human reviewer?

I built **Civic Signal**, an experimental decision workbench using [Laya](https://huggingface.co/convaiinnovations/laya), an open multilingual decision model.

The flow is simple: a resident describes a need → Laya selects the right language checkpoint → one inference call returns typed signals for service team, urgency, and essential-service access → a coordinator sees the full probability distribution and confirms the next step.

The interface makes uncertainty visible and flags low-confidence answers. In one live Hindi water-outage test, Laya identified the water team and an essential-access barrier, but rated urgency “Soon.” A visible safety rule raised the **review priority** to urgent, and the coordinator still makes the call. That disagreement is exactly why the raw distribution stays on screen.

No service is dispatched automatically. The model's base checkpoints still need domain-specific evaluation before any real-world use; this is a concept demo to explore what more responsive, accountable intake could look like.

**Built with:** Laya, Python, React, Vite. Designed for multilingual access and human oversight.

#OpenSource #AIforGood #CivicTech #MultilingualAI #HumanInTheLoop

---

**Post media:** [Ready-to-post story card](./assets/civic-signal-linkedin.png) or the [10-second motion preview](./assets/civic-signal-motion-preview.mp4). Open the workbench and click **Export story card** to create a fresh 1600 × 900 PNG, or use the [live product screenshot](./assets/civic-signal-live-desktop.png).
