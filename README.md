# HIRAYA

**A Bayesian Knowledge Tracing and Validated Graph-Based Framework for Learning Gap Remediation**

Thesis project, BS Computer Science, Tarlac State University.
Authors: Jimboy V. Fernandez, Ashley Miguel Manalo, Rycel Joshua Ruales.

HIRAYA estimates what each Grade 7 learner has mastered (Bayesian Knowledge Tracing), checks the skills behind a target competency using a teacher-validated prerequisite graph, and suggests which prerequisite skills to review first, in dependency order. It supports teacher judgment and does not replace it.

## Status

| Part | State |
| --- | --- |
| Frontend prototype (7 screens) | Done, runs on sample data |
| BKT update logic and tests (frontend) | Done with sample parameters. Fitting from response data is planned, second semester |
| Prerequisite graph module | Planned, second semester |
| Backend API and database | Planned, second semester |

All learner data, competencies, prerequisite links and practice questions in this repository are **sample data**. They are not the official MATATAG competency list.

## Getting started

Requires a recent Node.js LTS release.

```powershell
cd frontend
npm install
cd ..
npm run dev
```

Then open http://localhost:5173.

Scripts, run from the project root:

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

## Screens

| Route | User | Screen |
| --- | --- | --- |
| `/` | Both | Sign in |
| `/student` | Student | My progress |
| `/student/practice?skill=c2` | Student | Practice |
| `/student/path` | Student | Review path |
| `/teacher?target=c7&theta=0.95` | Teacher | Class overview with a target competency and a 95% / 98% mastery threshold |
| `/teacher/learner?learner=l01&target=c7&theta=0.95` | Teacher | Learner view with prerequisite graph |
| `/teacher/graph` | Teacher | Prerequisite graph review |

## Project structure

```
hiraya/
├── package.json            root scripts that forward to frontend
└── frontend/
    └── src/
        ├── components/     AppShell, Logo, MasteryBar, StatusPill
        ├── data/           sample competencies, learners, questions, graph layout
        ├── lib/            mastery bands, remediation path, class stats, prerequisite links
        ├── pages/          one file per screen
        ├── App.jsx         routes
        └── index.css       Tailwind theme (colors, fonts)
```

Stack: React, Vite, Tailwind CSS v4, React Router.

## How the remediation path works

`frontend/src/lib/path.js` implements the idea the study evaluates:

1. Start from the target competency.
2. Walk backward through its prerequisites.
3. Keep the prerequisites whose mastery is below the threshold (0.95 by default).
4. Order them so every skill comes after the skills it builds on (topological order), and put the target last.

## Connecting the backend (second semester)

The frontend reads everything through a few small modules, so each one maps to one API area.

| Frontend today | Replace with |
| --- | --- |
| `data/mock.js` competencies and prerequisite links | `GET /api/competencies` from the validated graph file |
| `data/mock.js` learner mastery | `GET /api/learners/{id}/mastery` (BKT output) |
| `lib/path.js` `remediationPath()` | `GET /api/learners/{id}/path?target=c7&theta=0.95` (NetworkX traversal). Keep the JS version as a test reference |
| `data/questions.js` | `GET /api/skills/{id}/items` and `POST /api/responses`, which returns the updated mastery |
| Graph review ratings (in memory) | `POST /api/validations`, plus a summary with Cohen's or Fleiss' kappa |
| 95% / 98% switch | `theta` query parameter |
| Sample sign-in | Real accounts with student and teacher roles |

Planned backend: Python and FastAPI, a BKT module fitted with pyBKT on the ASSISTments benchmark, NetworkX for the graph, PostgreSQL for storage.

## Limits

- Covers only the skills modeled in the graph.
- The graph is validated by a limited number of experts.
- Recommendations are candidate priorities, not diagnoses.
- No claim of learning gains. That would need a separate pretest-posttest study.