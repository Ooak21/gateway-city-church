# GateWay City Church (Las Vegas)

One origin. Public site, House app, Grace staff board.

Live: https://ooak21.github.io/gateway-city-church/

| Path | What it is |
|---|---|
| `/` | Public campus site (Isaac's content, one visual language) |
| `/grow-tracks.html` | Discipleship path |
| `/app/` | Congregant House app (check-in, prayer, serve, pastors) |
| `/app/sunday.html` | Sanctuary projector QR |
| `/app/staff.html` | Grace people file (staff). Light ops UI against IBS church_* tables. Miguel's dark Vercel Grace is a different database. |
| `/app/login.html` | Staff sign-in |

House and Grace write the same IBS `church_*` tables. Miguel's Vercel Grace still reads his own Supabase until that gets repointed.

Check In on the public site opens `/app/`. The Sunday QR encodes `/app/index.html?src=qr`.
