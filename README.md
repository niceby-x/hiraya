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

### What the prototype does and does not do today

- **Practice updates mastery in browser memory only.** Each answer runs the BKT update and the screens change at once, but nothing is stored. A page reload restores the sample values. There is no database and no permanent learner record.
- **BKT parameters are sample values, not fitted.** Every skill uses the same guess 0.20, slip 0.10 and learn 0.15 (`data/bktParams.js`), and each learner starts from a sample mastery value. Fitting from response data (pyBKT) is planned.
- **All people and data are sample data.** There are eight sample learners, sample prerequisite links and sample practice questions. Graph review ratings are not saved.
- **Sign-in is a demo.** There are no real accounts, roles or authentication. The student and teacher screens share state only inside one browser tab, so nothing syncs between accounts or devices.
- **The student screens are fixed to Learner 01, target `c7` and a 95% threshold.** The target selector and the 95% / 98% switch are on the teacher screens.

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
| `npm test` | Run the unit tests (Node's built-in test runner). Also works as `npm test` inside `frontend/` |

## Screens

| Route | User | Screen |
| --- | --- | --- |
| `/` | Both | Sign in |
| `/student` | Student | My progress |
| `/student/practice?skill=c2` | Student | Practice |
| `/student/path` | Student | Review path |
| `/teacher?target=c7&theta=0.95` | Teacher | Class overview with a target competency and a 95% / 98% mastery threshold |
| `/teacher/learner?learner=l01&target=c7&theta=0.95` | Teacher | Learner view with prerequisite graph. Without a `learner`, it shows a list to choose from |
| `/teacher/graph` | Teacher | Prerequisite graph review |

## Project structure

```
hiraya/
├── package.json            root scripts that forward to frontend
└── frontend/
    └── src/
        ├── components/     AppShell, Logo, MasteryBar, StatusPill
        ├── data/           sample competencies, learners, questions, graph layout
        ├── lib/            BKT update, in-memory learner store, mastery bands, remediation path, class stats, teacher URL context
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

`candidatePath()` appends the target only when its own mastery is below the threshold. If the target already meets the threshold, the path is empty for that learner and target, even when a prerequisite is below the threshold (those estimates stay visible on the teacher pages). The student pages use `remediationPath()`, which returns `candidatePath().path`, so teacher and student pages never disagree.

## Connecting the backend (second semester)

The frontend reads everything through a few small modules, so each one maps to one API area.

| Frontend today | Replace with |
| --- | --- |
| `data/mock.js` competencies and prerequisite links | `GET /api/competencies` from the validated graph file |
| `data/mock.js` learner mastery | `GET /api/learners/{id}/mastery` (BKT output) |
| `lib/path.js` `candidatePath()` and `remediationPath()` | `GET /api/learners/{id}/path?target=c7&theta=0.95` (NetworkX traversal). Keep the JS version as a test reference |
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