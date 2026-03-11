# BBQ Judge — Port Registry
> 📍 Location: `~/projects/bbq-judge`
> 🗓️ Last Updated: 2026-03-08

---

## ✅ This Project's Ports

| Service         | Port  | Command              | Notes                        |
|-----------------|-------|----------------------|------------------------------|
| Frontend        | 3030  | `npm run dev`        | Vite/Next dev server         |
| Backend API     | 4030  | `npm run server`     | Express/Node API             |
| Database (PG)   | 5444  | local postgres       | Always running               |
| Redis           | 6383  | `redis-server`       | Optional / cache             |

---

## 🚫 Reserved Ports — DO NOT USE
> These ports are claimed by other active projects on this machine.
> Assigning any of these to BBQ Judge services will cause conflicts.

| Port  | Reason / Owner                              |
|-------|---------------------------------------------|
| 3010  | **fbst** — Frontend dev server              |
| 4010  | **fbst** — Backend API                      |
| 5442  | **fbst** — PostgreSQL                       |
| 6381  | **fbst** — Redis                            |
| 3020  | **fvsppro** — Frontend dev server           |
| 4020  | **fvsppro** — Backend API                   |
| 5443  | **fvsppro** — PostgreSQL                    |
| 6382  | **fvsppro** — Redis                         |
| 3040  | **ktv-singer** — Frontend dev server        |
| 4040  | **ktv-singer** — Backend API                |
| 5445  | **ktv-singer** — PostgreSQL                 |
| 8040  | **ktv-singer** — WebSocket server           |
| 4050  | **tastemakers-backend** — API Server        |
| 4051  | **tastemakers-backend** — Admin/Swagger     |
| 5446  | **tastemakers-backend** — PostgreSQL        |
| 6384  | **tastemakers-backend** — Redis             |

---

## 🤖 Claude Context Prompt
> Paste this at the start of any Claude session when working on BBQ Judge:

```
I am working on the BBQ Judge project located at ~/projects/bbq-judge.

Port assignments for THIS project:
- Frontend: 3030
- API: 4030
- PostgreSQL: 5444
- Redis: 6383

The following ports are RESERVED by other projects on this machine and must
NEVER be suggested or used for BBQ Judge:
3010, 4010, 5442, 6381 (fbst)
3020, 4020, 5443, 6382 (fvsppro)
3040, 4040, 5445, 8040 (ktv-singer)
4050, 4051, 5446, 6384 (tastemakers-backend)

Always use ports in the 3030/4030/5444/6383 range for any new BBQ Judge services.
If you need to add a new service, suggest ports in the 3031-3039 or 4031-4039 range.
```

---

## 🆕 Available Overflow Ports (if you add new services)
| Range         | Use for                              |
|---------------|--------------------------------------|
| 3031 – 3039   | Additional BBQ Judge frontend services|
| 4031 – 4039   | Additional BBQ Judge backend services |
| 5444x         | Additional BBQ Judge DB instances     |
