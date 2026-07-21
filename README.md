# MindPulse — A Multi-Modal AI System for Early Detection of Mental Health Crisis in Young Adults

MindPulse is a full-stack, explainable-AI web application that screens young adults for depression and anxiety using the gold-standard **PHQ-9** and **GAD-7** clinical instruments, then layers machine learning, SHAP-based explainability, and an LLM-generated personalized wellness report on top of the raw scores.

It was built as an academic research project exploring how multi-modal signals (clinical questionnaire scores, demographic context, and longitudinal history) can be combined into a single, interpretable early-warning system for mental health crises — rather than a black-box severity classifier.

> ⚠️ **Disclaimer:** MindPulse is a research prototype and screening aid. It is **not** a diagnostic tool and does not replace professional clinical judgment. If you or someone you know is in crisis, please contact a licensed mental health professional or a crisis helpline immediately.

---

## ✨ Key Features

- **PHQ-9 & GAD-7 Screening** — Standardized, clinically validated 9-item depression and 7-item anxiety questionnaires.
- **Severity Classification** — Multi-class ML models predict depression and anxiety severity (0–3: minimal → severe), with clinical score-range overrides to keep predictions clinically valid.
- **SHAP Explainability** — Per-instance SHAP values reveal exactly which symptoms drove each prediction, domain-filtered so depression drivers come from PHQ items and anxiety drivers from GAD items.
- **Mental Health Index (MHI)** — A composite 0–100 wellness score blending normalized PHQ-9 and GAD-7 results into a single, interpretable metric (Good / Moderate / Poor / Critical).
- **Early Warning Detection** — Real-time rule-based flags for suicidal ideation, elevated self-worth risk, and diffuse cross-domain distress.
- **Risk Escalation Engine** — A weighted, multi-factor scoring system (ML output + raw clinical thresholds + MHI band + warning signals + safety-item flags) that produces a calibrated Low → Critical risk level with a matching action protocol.
- **Temporal / Longitudinal Analysis** — Tracks a user's MHI, PHQ, and GAD trajectories across sessions, detecting deterioration, volatility, and risk-level trends over time.
- **Personalized AI Recommendations** — A carefully prompt-engineered LLaMA 3.3 70B (via Groq) generates a warm, non-generic, symptom-specific wellness narrative tailored to the user's exact reported symptoms, stressors, sleep pattern, and support system.
- **Secure Auth & History** — JWT-based signup/login with bcrypt password hashing, and a persistent assessment history per user.

---

## 🏗️ Architecture

```
![Architecture Diagram](https://github.com/abhishek-sriram/MindPulse-A-Multi-Modal-AI-System-For-Early-Detection-Of-Mental-Health-Crisis-In-Young-Adults/blob/42b1b4ee5cd7bb70bc4c893d7319741f17ca6863/Project%20Architecture%20Diagram.png)

```

### Frontend
- **React 18 + TypeScript**, bundled with **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives) for the component library
- **Framer Motion** for animation, **Recharts** for data visualization
- **React Router** for navigation, **React Hook Form + Zod** for form validation
- **Vitest** + Testing Library for unit tests

Key pages: `Index`, `Assessment`, `Results`, `History`, `Login`/`Signup`, `Features`, `About`.

### Backend
- **FastAPI** REST API (`backend/app.py`)
- **scikit-learn** classifiers (`depression_model.pkl`, `anxiety_model.pkl`) for severity prediction
- **SHAP** explainers for per-symptom feature attribution
- **MySQL** (via `mysql-connector-python` connection pooling) for user accounts and assessment history, with idempotent startup migrations
- **Groq API** (LLaMA 3.3 70B Versatile) for the personalized recommendation narrative
- **JWT + bcrypt** authentication

### Model Training
- `MindPulse_Model_Building.ipynb` — the notebook used to train and evaluate the depression and anxiety classifiers on `mental_health.csv`.

---

## 📁 Project Structure

```
├── src/                       # React frontend
│   ├── components/            # UI components (shadcn/ui + custom)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities, assessment data, session handling
│   ├── pages/                 # Route-level pages (Assessment, Results, History, etc.)
│   └── test/                  # Vitest unit tests
├── backend/
│   ├── app.py                 # FastAPI application (models, SHAP, MHI, risk engine, auth)
│   ├── depression_model.pkl   # Trained depression severity classifier
│   ├── anxiety_model.pkl      # Trained anxiety severity classifier
│   ├── requirements.txt       # Python dependencies
│   └── test.py / check_models.py
├── mental_health.csv          # Training dataset
├── MindPulse_Model_Building.ipynb  # Model training & evaluation notebook
├── Final Project Report (Signed Copy).pdf  # Academic project report
└── package.json / vite.config.ts / tailwind.config.ts  # Frontend tooling
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm (or bun)
- Python 3.10+ 
- MySQL server
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repository
```bash
git clone https://github.com/abhishek-sriram/MindPulse-A-Multi-Modal-AI-System-For-Early-Detection-Of-Mental-Health-Crisis-In-Young-Adults.git
cd MindPulse-A-Multi-Modal-AI-System-For-Early-Detection-Of-Mental-Health-Crisis-In-Young-Adults
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
GROQ_API_KEY=your_groq_api_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=mindpulse
FRONTEND_URL=http://localhost:5173
JWT_SECRET=change-me-in-production
```

Run the API (tables and migrations are created automatically on startup):
```bash
uvicorn app:app --reload
```
The API will be available at `http://localhost:8000` (interactive docs at `/docs`).

### 3. Frontend setup
```bash
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

### 4. (Optional) Retrain the models
Open `MindPulse_Model_Building.ipynb` to explore the training pipeline on `mental_health.csv` and regenerate `depression_model.pkl` / `anxiety_model.pkl`.

---

## 🔌 API Overview

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check (API + DB connectivity) |
| `/auth/signup` | POST | Create a new user account |
| `/auth/login` | POST | Authenticate and receive a JWT |
| `/predict` | POST | Run PHQ-9/GAD-7 answers through the models; returns severity, SHAP factors, MHI, early warnings, risk escalation, and an AI-generated recommendation |
| `/explain` | POST | Same analytical pipeline as `/predict` without persisting to the DB or generating the LLM narrative |
| `/trend/{user_email}` | GET | Longitudinal trend and temporal analysis across a user's assessment history |

---

## 🧠 Novel Contributions

1. **Mental Health Index (MHI)** — a single normalized 0–100 score combining PHQ-9 and GAD-7 for at-a-glance wellness tracking.
2. **Early Warning Detection** — rule-based safety net layered on top of ML predictions to catch clinically critical signals (e.g., suicidal ideation) that a severity classifier alone might under-weight.
3. **Risk Escalation Engine** — a transparent, weighted composite of ML output, raw clinical thresholds, MHI band, warning level, and safety-item flags, calibrated into actionable Low → Critical protocols.
4. **Temporal Modeling** — deterioration and volatility detection across repeated screenings, not just a single-session snapshot.

---

## 📄 Academic Report

The full project write-up, methodology, and evaluation results are available in [`Final Project Report (Signed Copy).pdf`](./Final%20Project%20Report%20(Signed%20Copy).pdf).

## 📄 Research Paper

To view and download my published research paper, click [Paper Link](https://ieeexplore.ieee.org/document/11554646)

---

## 🛡️ Ethical Considerations

This system handles sensitive mental health data. It is designed for research and educational purposes:
- No diagnosis is made or implied — only standardized screening scores and risk indicators.
- Users reporting suicidal ideation are always shown crisis resources and encouraged toward professional care.
- Assessment data is stored to enable longitudinal tracking; deployments should ensure appropriate data protection, consent, and compliance with local health-data regulations before any real-world use.

---

## 📜 License

Add your preferred license (e.g., MIT) here.

## 🙌 Acknowledgments

Built with FastAPI, scikit-learn, SHAP, React, shadcn/ui, and Groq-hosted LLaMA 3.3 70B.
