# Demo Checklist

## Product walkthrough

1. Register a new user or log in with a seeded test user.
2. Reload and show that the session persists.
3. Select one of the seeded rooms and show name, floor, and capacity.
4. Navigate previous/current/next weeks in the custom schedule.
5. Explain browser-timezone display and `Europe/Kyiv` office validation.
6. Create a valid future booking.
7. Show the confirmed booking in the schedule.
8. Attempt an overlapping booking.
9. Show the stable, understandable conflict error.
10. Show distinct owned and foreign booking presentation.
11. Demonstrate that foreign cancellation is unavailable in UI and forbidden
    through a direct API request.
12. Cancel an owned booking with confirmation/undo behavior.
13. Show upcoming and past personal bookings, pagination, and navigation back
    to the corresponding room/week.
14. Demonstrate the core flow on a phone-sized viewport.
15. If implemented, run the two-contender race demonstration and show one
    active winner.

## Clean-machine readiness

- [ ] Clone succeeds without untracked required assets.
- [ ] Required Node/Yarn/Docker versions are documented.
- [ ] `.env.example` lists every required variable without secrets.
- [ ] Dependency installation uses the pinned package manager.
- [ ] Local startup commands are exact.
- [ ] Docker Compose startup is exact when the bonus is delivered.
- [ ] Committed migrations run before readiness.
- [ ] Seeds are deterministic and safe to rerun as documented.
- [ ] Two test users and credentials are documented.
- [ ] Database, WAL, and SHM persist on the API-owned volume.
- [ ] `npm test` runs real tests.
- [ ] `yarn verify:commit` passes without an exception.
- [ ] Production build starts and health checks become ready.
- [ ] Known limitations and implemented bonuses are documented.
- [ ] Git status is clean before the demo.

## Demo recovery

- Keep a documented clean reseed path.
- Have a known room/week containing demo bookings.
- Do not manually edit SQLite during the demo.
- If the network or optional push fails, continue with mandatory local flows.
