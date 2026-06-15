from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel, validator
import joblib
import numpy as np
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
from groq import Groq
from dotenv import load_dotenv
import os
import shap

# -------------------- LOAD ENV VARIABLES --------------------
load_dotenv()

GROQ_API_KEY  = os.getenv("GROQ_API_KEY")
DB_HOST       = os.getenv("DB_HOST", "localhost")
DB_USER       = os.getenv("DB_USER", "root")
DB_PASSWORD   = os.getenv("DB_PASSWORD", "")
DB_NAME       = os.getenv("DB_NAME", "mindpulse")
FRONTEND_URL  = os.getenv("FRONTEND_URL", "http://localhost:5173")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY missing in .env file")
if not all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    raise ValueError("Database credentials missing in .env file")

# -------------------- CONNECTION POOL --------------------
db_pool: pooling.MySQLConnectionPool | None = None

def init_db_pool():
    global db_pool
    db_pool = pooling.MySQLConnectionPool(
        pool_name="mindpulse_pool",
        pool_size=5,
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
    )

def get_db_connection():
    if db_pool is None:
        raise RuntimeError("DB pool not initialized")
    return db_pool.get_connection()


# -------------------- DB MIGRATION --------------------
def migrate_db():
    conn = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()

        # ── Step 1: Create tables if they don't exist yet ─────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                full_name     VARCHAR(255) NOT NULL,
                username      VARCHAR(100) NOT NULL UNIQUE,
                email         VARCHAR(255) NOT NULL UNIQUE,
                phone         VARCHAR(30)  NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create assessments table with ALL fields
        cur.execute("""
            CREATE TABLE IF NOT EXISTS assessments (
                id               INT AUTO_INCREMENT PRIMARY KEY,
                user_name        VARCHAR(255),
                user_email       VARCHAR(255),
                age              INT DEFAULT 0,
                gender           VARCHAR(50),
                education        VARCHAR(255) DEFAULT '',
                occupation       VARCHAR(255) DEFAULT '',
                sleep_pattern    VARCHAR(100) DEFAULT '',
                stress_source    VARCHAR(255) DEFAULT '',
                mental_history   VARCHAR(255) DEFAULT '',
                support_system   VARCHAR(255) DEFAULT '',
                stressful_events TEXT,
                phq_q1           INT DEFAULT 0,
                phq_q2           INT DEFAULT 0,
                phq_q3           INT DEFAULT 0,
                phq_q4           INT DEFAULT 0,
                phq_q5           INT DEFAULT 0,
                phq_q6           INT DEFAULT 0,
                phq_q7           INT DEFAULT 0,
                phq_q8           INT DEFAULT 0,
                phq_q9           INT DEFAULT 0,
                phq_score        INT,
                gad_q1           INT DEFAULT 0,
                gad_q2           INT DEFAULT 0,
                gad_q3           INT DEFAULT 0,
                gad_q4           INT DEFAULT 0,
                gad_q5           INT DEFAULT 0,
                gad_q6           INT DEFAULT 0,
                gad_q7           INT DEFAULT 0,
                gad_score        INT,
                depression_level INT,
                anxiety_level    INT,
                confidence_pct   FLOAT DEFAULT 0.0,
                risk_level       VARCHAR(50),
                mhi_score        FLOAT DEFAULT 0.0,
                mhi_label        VARCHAR(20) DEFAULT 'Unknown',
                escalation_score FLOAT DEFAULT 0.0,
                warning_level    VARCHAR(20) DEFAULT 'None',
                created_at       DATETIME
            )
        """)

        # ── Step 2: Fix users table — rename any legacy password column ─────────
        # Use INFORMATION_SCHEMA for reliable column inspection
        cur.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
        """)
        users_cols = [row[0] for row in cur.fetchall()]
        print(f"ℹ️  users table columns: {users_cols}")

        if "password_hash" not in users_cols:
            # Find whichever legacy name was used
            legacy = next((c for c in users_cols if "pass" in c.lower() or "pwd" in c.lower()), None)
            if legacy:
                print(f"⚠️  Renaming column '{legacy}' → 'password_hash'")
                cur.execute(
                    f"ALTER TABLE users CHANGE COLUMN `{legacy}` `password_hash` VARCHAR(255) NOT NULL"
                )
                print("✅ Renamed password column to password_hash")
            else:
                print("⚠️  password_hash column missing and no legacy found — adding it")
                cur.execute(
                    "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '' AFTER phone"
                )
                print("✅ Added password_hash column")
        else:
            print("✅ users.password_hash column exists — no migration needed")

        # ── Step 3: Assessments table — add missing columns idempotently ────────
        cur.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'assessments'
        """)
        existing = [row[0] for row in cur.fetchall()]
        migrations = {
            "occupation":       "ALTER TABLE assessments ADD COLUMN occupation VARCHAR(255) DEFAULT ''",
            "support_system":   "ALTER TABLE assessments ADD COLUMN support_system VARCHAR(255) DEFAULT ''",
            "stressful_events": "ALTER TABLE assessments ADD COLUMN stressful_events TEXT",
        }
        for col, sql in migrations.items():
            if col not in existing:
                cur.execute(sql)
                print(f"✅ Added assessments column: {col}")

        conn.commit()
        cur.close()
        conn.close()
        print("✅ DB Migration Complete")

    except Exception as e:
        # Log clearly AND re-raise so startup fails visibly instead of silently
        import traceback
        print(f"❌ DB Migration FAILED: {e}")
        print(traceback.format_exc())
        if conn:
            try: conn.close()
            except: pass
        raise RuntimeError(f"DB migration failed: {e}") from e


# -------------------- FASTAPI LIFESPAN --------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db_pool()
    print("✅ MySQL Connection Pool Initialized")
    migrate_db()   # raises RuntimeError on failure — intentional, stops startup
    print("✅ App startup complete — DB ready")
    yield


# -------------------- FASTAPI INIT --------------------
app = FastAPI(title="MindPulse API", version="2.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# -------------------- LOAD ML MODELS --------------------
dep_model = joblib.load("depression_model.pkl")
anx_model = joblib.load("anxiety_model.pkl")

# -------------------- SHAP EXPLAINERS --------------------
dep_explainer = shap.Explainer(dep_model)
anx_explainer = shap.Explainer(anx_model)

# 18 features: 9 PHQ items + PHQ total + 7 GAD items + GAD total
feature_names = [
    "phq_little_interest",
    "phq_feeling_down",
    "phq_sleep_issues",
    "phq_low_energy",
    "phq_appetite",
    "phq_self_worth",
    "phq_concentration",
    "phq_psychomotor",
    "phq_suicidal_thoughts",
    "phq_total_score",
    "gad_nervous",
    "gad_uncontrollable_worry",
    "gad_excessive_worry",
    "gad_trouble_relaxing",
    "gad_restlessness",
    "gad_irritability",
    "gad_fear",
    "gad_total_score",
]

# Explicitly mark which features are "total score" composites — ALWAYS exclude from SHAP output
SHAP_EXCLUDE_FEATURES = {"phq_total_score", "gad_total_score"}

FEATURE_CLINICAL_LABELS = {
    "phq_little_interest":      "little interest or pleasure in doing things",
    "phq_feeling_down":         "feeling down, depressed, or hopeless",
    "phq_sleep_issues":         "trouble falling/staying asleep, or sleeping too much",
    "phq_low_energy":           "feeling tired or having little energy",
    "phq_appetite":             "poor appetite or overeating",
    "phq_self_worth":           "feeling bad about yourself or like a failure",
    "phq_concentration":        "trouble concentrating on things",
    "phq_psychomotor":          "moving/speaking slowly or being fidgety/restless",
    "phq_suicidal_thoughts":    "thoughts of self-harm or that you would be better off dead",
    "gad_nervous":              "feeling nervous, anxious, or on edge",
    "gad_uncontrollable_worry": "not being able to stop or control worrying",
    "gad_excessive_worry":      "worrying too much about different things",
    "gad_trouble_relaxing":     "trouble relaxing",
    "gad_restlessness":         "being so restless it is hard to sit still",
    "gad_irritability":         "becoming easily annoyed or irritable",
    "gad_fear":                 "feeling afraid, as if something awful might happen",
}

# Features that belong to each domain — used for domain-filtered SHAP
PHQ_FEATURES = {
    "phq_little_interest", "phq_feeling_down", "phq_sleep_issues",
    "phq_low_energy", "phq_appetite", "phq_self_worth",
    "phq_concentration", "phq_psychomotor", "phq_suicidal_thoughts",
}
GAD_FEATURES = {
    "gad_nervous", "gad_uncontrollable_worry", "gad_excessive_worry",
    "gad_trouble_relaxing", "gad_restlessness", "gad_irritability", "gad_fear",
}

DEP_SEVERITY_LABELS = {
    0: "minimal or no depression",
    1: "mild to moderate depression",
    2: "moderately severe depression",
    3: "severe depression",
}
ANX_SEVERITY_LABELS = {
    0: "minimal anxiety",
    1: "mild anxiety",
    2: "moderate anxiety",
    3: "severe anxiety",
}

# -------------------- GROQ CLIENT --------------------
groq_client = Groq(api_key=GROQ_API_KEY)


# -------------------- INPUT SCHEMA --------------------
class MentalInput(BaseModel):
    user_name:  str = "Anonymous"
    user_email: str = "anonymous@mindpulse.com"
    age:        int = 0
    gender:     str = "Unknown"

    phq_little_interest:   int
    phq_feeling_down:      int
    phq_sleep_issues:      int
    phq_low_energy:        int
    phq_appetite:          int
    phq_self_worth:        int
    phq_concentration:     int
    phq_psychomotor:       int
    phq_suicidal_thoughts: int = 0
    phq_total_score:       int

    gad_nervous:              int
    gad_uncontrollable_worry: int
    gad_excessive_worry:      int
    gad_trouble_relaxing:     int
    gad_restlessness:         int
    gad_irritability:         int
    gad_fear:                 int
    gad_total_score:          int

    @validator(
        "phq_little_interest", "phq_feeling_down", "phq_sleep_issues",
        "phq_low_energy", "phq_appetite", "phq_self_worth",
        "phq_concentration", "phq_psychomotor", "phq_suicidal_thoughts",
        "gad_nervous", "gad_uncontrollable_worry", "gad_excessive_worry",
        "gad_trouble_relaxing", "gad_restlessness", "gad_irritability", "gad_fear",
        pre=True,
    )
    def score_in_range(cls, v):
        if not (0 <= int(v) <= 3):
            raise ValueError(f"Item score must be 0–3, got {v}")
        return int(v)

    @validator("phq_total_score", pre=True)
    def phq_total_in_range(cls, v):
        if not (0 <= int(v) <= 27):
            raise ValueError(f"PHQ total must be 0–27, got {v}")
        return int(v)

    @validator("gad_total_score", pre=True)
    def gad_total_in_range(cls, v):
        if not (0 <= int(v) <= 21):
            raise ValueError(f"GAD total must be 0–21, got {v}")
        return int(v)

    # Optional demographics
    education:       str = ""
    occupation:      str = ""
    sleep_pattern:   str = ""
    stress_source:   str = ""
    mental_history:  str = ""
    support_system:  str = ""
    stressful_events: str = ""


# ============================================================
# HELPER: Build feature vector
# ============================================================
def build_feature_vector(data: MentalInput) -> np.ndarray:
    return np.array([[
        data.phq_little_interest,
        data.phq_feeling_down,
        data.phq_sleep_issues,
        data.phq_low_energy,
        data.phq_appetite,
        data.phq_self_worth,
        data.phq_concentration,
        data.phq_psychomotor,
        data.phq_suicidal_thoughts,
        data.phq_total_score,
        data.gad_nervous,
        data.gad_uncontrollable_worry,
        data.gad_excessive_worry,
        data.gad_trouble_relaxing,
        data.gad_restlessness,
        data.gad_irritability,
        data.gad_fear,
        data.gad_total_score,
    ]])


# ============================================================
# HELPER: Extract SHAP top-N features (per-instance, domain-filtered)
# ============================================================
def get_shap_top_features(
    explainer,
    values: np.ndarray,
    n: int = 5,
    domain_filter: set | None = None,
) -> list[dict]:
    """
    Returns top-N INDIVIDUAL symptom features by absolute SHAP impact.
    - phq_total_score and gad_total_score are ALWAYS excluded (they are composite sums).
    - If domain_filter is provided (e.g. PHQ_FEATURES), only features in that set are returned.
      This ensures depression drivers are PHQ items and anxiety drivers are GAD items.
    - Returns actual per-instance SHAP value plus the raw item score for context.
    """
    shap_vals = explainer(values)
    instance  = shap_vals.values[0]

    # Multi-class: pick SHAP value for the predicted class (highest magnitude across classes)
    if instance.ndim == 2:
        # Sum absolute values across classes for ranking, then take dominant-class value
        abs_vals = np.abs(instance).sum(axis=1)
    else:
        abs_vals = np.abs(instance)

    # Build exclude set: always exclude totals, optionally restrict to domain
    exclude_set = SHAP_EXCLUDE_FEATURES.copy()
    if domain_filter is not None:
        # Exclude features NOT in the domain filter
        for i, fname in enumerate(feature_names):
            if fname not in domain_filter and fname not in SHAP_EXCLUDE_FEATURES:
                exclude_set.add(fname)

    # Sort by descending absolute impact, then select top-n after exclusions
    all_sorted_idx = np.argsort(abs_vals)[::-1]
    selected_idx = []
    for i in all_sorted_idx:
        if feature_names[int(i)] not in exclude_set:
            selected_idx.append(i)
        if len(selected_idx) == n:
            break

    results = []
    for i in selected_idx:
        raw = instance[int(i)]
        if hasattr(raw, "__len__"):
            impact = float(raw[np.argmax(np.abs(raw))])
        else:
            impact = float(raw)

        fname = feature_names[int(i)]
        results.append({
            "feature":        fname,
            "impact":         round(impact, 4),
            "abs_impact":     round(abs(impact), 4),
            "direction":      "increases risk" if impact > 0 else "decreases risk",
            "clinical_label": FEATURE_CLINICAL_LABELS.get(fname, fname.replace("_", " ")),
        })
    return results


# ============================================================
# HELPER: All-feature SHAP values for radar/heatmap charts
# ============================================================
def get_all_shap_values(explainer, values: np.ndarray) -> list[dict]:
    """Returns SHAP value for every individual symptom (excludes total scores)."""
    shap_vals = explainer(values)
    instance  = shap_vals.values[0]

    if instance.ndim == 2:
        abs_vals = np.abs(instance).sum(axis=1)
    else:
        abs_vals = np.abs(instance)

    results = []
    for i, fname in enumerate(feature_names):
        if fname in SHAP_EXCLUDE_FEATURES:
            continue
        raw = instance[i]
        if hasattr(raw, "__len__"):
            impact = float(raw[np.argmax(np.abs(raw))])
        else:
            impact = float(raw)
        results.append({
            "feature":        fname,
            "impact":         round(impact, 4),
            "abs_impact":     round(abs(impact), 4),
            "clinical_label": FEATURE_CLINICAL_LABELS.get(fname, fname.replace("_", " ")),
            "domain":         "depression" if fname in PHQ_FEATURES else "anxiety",
        })
    return results


# ============================================================
# NOVELTY 1 — MENTAL HEALTH INDEX (MHI)
# ============================================================
def compute_mhi(phq_score: int, gad_score: int) -> dict:
    phq_norm     = phq_score / 27.0
    gad_norm     = gad_score / 21.0
    raw_distress = (phq_norm * 0.6) + (gad_norm * 0.4)
    mhi          = round((1 - raw_distress) * 100, 2)
    mhi          = max(0.0, min(100.0, mhi))

    if   mhi >= 75: mhi_label = "Good"
    elif mhi >= 50: mhi_label = "Moderate"
    elif mhi >= 25: mhi_label = "Poor"
    else:           mhi_label = "Critical"

    return {"mhi_score": mhi, "mhi_label": mhi_label}


# ============================================================
# NOVELTY 2 — EARLY WARNING DETECTION
# ============================================================
def early_warning_detection(data: MentalInput) -> dict:
    warnings      = []
    warning_level = "None"

    phq_items = [
        data.phq_little_interest, data.phq_feeling_down,
        data.phq_sleep_issues,    data.phq_low_energy,
        data.phq_appetite,        data.phq_self_worth,
        data.phq_concentration,   data.phq_psychomotor,
        data.phq_suicidal_thoughts,
    ]
    gad_items = [
        data.gad_nervous,              data.gad_uncontrollable_worry,
        data.gad_excessive_worry,      data.gad_trouble_relaxing,
        data.gad_restlessness,         data.gad_irritability,
        data.gad_fear,
    ]

    # CRITICAL: suicidal thoughts (Q9)
    if data.phq_suicidal_thoughts >= 1:
        warnings.append({
            "type":    "CRITICAL",
            "domain":  "Safety",
            "message": (
                "Thoughts of self-harm or death have been reported. "
                "Please seek immediate support from a mental health professional or crisis helpline."
            ),
            "item":  "phq_suicidal_thoughts",
            "score": data.phq_suicidal_thoughts,
        })
        warning_level = "Critical"

    # CRITICAL: self-worth item ≥ 2
    if data.phq_self_worth >= 2 and warning_level != "Critical":
        warnings.append({
            "type":    "CRITICAL",
            "domain":  "Depression",
            "message": (
                "Elevated feelings of failure or worthlessness detected. "
                "Consider immediate professional consultation."
            ),
            "item":  "phq_self_worth",
            "score": data.phq_self_worth,
        })
        warning_level = "Critical"

    # WARNING: 3+ PHQ items ≥ 2
    phq_elevated = [v for v in phq_items if v >= 2]
    if len(phq_elevated) >= 3 and warning_level != "Critical":
        warnings.append({
            "type":           "WARNING",
            "domain":         "Depression",
            "message":        (
                f"{len(phq_elevated)} depression-related symptoms are elevated. "
                "Early intervention is recommended."
            ),
            "elevated_count": len(phq_elevated),
        })
        warning_level = "Warning"

    # WARNING: 3+ GAD items ≥ 2
    gad_elevated = [v for v in gad_items if v >= 2]
    if len(gad_elevated) >= 3:
        warnings.append({
            "type":           "WARNING",
            "domain":         "Anxiety",
            "message":        (
                f"{len(gad_elevated)} anxiety-related symptoms are elevated. "
                "Monitoring advised."
            ),
            "elevated_count": len(gad_elevated),
        })
        if warning_level == "None":
            warning_level = "Warning"

    # WATCH: diffuse distress across all items
    if all(v > 0 for v in phq_items + gad_items) and warning_level == "None":
        warnings.append({
            "type":    "WATCH",
            "domain":  "General",
            "message": "Symptoms present across all domains. Recommend re-screening in 2 weeks.",
        })
        warning_level = "Watch"

    return {
        "warning_level":  warning_level,
        "warnings":       warnings,
        "total_warnings": len(warnings),
    }


# ============================================================
# NOVELTY 3 — RISK ESCALATION ENGINE (Improved accuracy)
# ============================================================
def risk_escalation_engine(
    dep_pred:  int,
    anx_pred:  int,
    mhi:       dict,
    warning:   dict,
    phq_score: int,
    gad_score: int,
    data:      MentalInput | None = None,
) -> dict:
    """
    Multi-factor risk scoring using:
    1. ML model predictions (weighted by severity level)
    2. Raw clinical scores (PHQ-9 and GAD-7 thresholds)
    3. MHI wellness band
    4. Early warning signals
    5. Specific high-risk item flags (suicidal ideation, self-worth)
    
    Scoring is calibrated so that Low risk truly reflects low clinical concern
    and Critical truly requires urgent action.
    """

    # --- Component 1: ML severity prediction (0-6 points combined) ---
    dep_score_map = {0: 0, 1: 1, 2: 2.5, 3: 4}
    anx_score_map = {0: 0, 1: 0.5, 2: 1.5, 3: 2.5}
    ml_score = dep_score_map.get(dep_pred, 0) + anx_score_map.get(anx_pred, 0)

    # --- Component 2: Raw clinical score thresholds ---
    raw_score = 0.0
    if phq_score >= 20:      raw_score += 2.0   # Severe PHQ-9
    elif phq_score >= 15:    raw_score += 1.5   # Moderately severe
    elif phq_score >= 10:    raw_score += 1.0   # Moderate
    elif phq_score >= 5:     raw_score += 0.5   # Mild

    if gad_score >= 15:      raw_score += 1.5   # Severe GAD-7
    elif gad_score >= 10:    raw_score += 1.0   # Moderate
    elif gad_score >= 5:     raw_score += 0.5   # Mild

    # --- Component 3: MHI wellness band ---
    mhi_score = 0.0
    if   mhi["mhi_label"] == "Critical": mhi_score = 2.0
    elif mhi["mhi_label"] == "Poor":     mhi_score = 1.0
    elif mhi["mhi_label"] == "Moderate": mhi_score = 0.5
    else:                                mhi_score = 0.0

    # --- Component 4: Warning signals ---
    warning_score = 0.0
    if   warning["warning_level"] == "Critical": warning_score = 3.0
    elif warning["warning_level"] == "Warning":  warning_score = 1.5
    elif warning["warning_level"] == "Watch":    warning_score = 0.5

    # --- Component 5: Specific item flags (critical safety items) ---
    item_score = 0.0
    if data is not None:
        if data.phq_suicidal_thoughts >= 2:   item_score += 3.0   # Serious suicidal ideation
        elif data.phq_suicidal_thoughts == 1: item_score += 1.5   # Some suicidal thoughts
        if data.phq_self_worth >= 2:          item_score += 1.0   # Persistent self-worth issues

    # --- Weighted composite score (max theoretical ~15) ---
    # Weights: ml=35%, raw=25%, mhi=10%, warning=20%, items=10%
    escalation_score = (
        ml_score      * 0.35 +
        raw_score     * 0.25 +
        mhi_score     * 0.10 +
        warning_score * 0.20 +
        item_score    * 0.10
    )

    # Scale to 0-7 range for display compatibility
    # Raw max approx 3.5+1.5+0.3+0.9+0.45 ≈ 6.65 → normalize to 0-7
    escalation_score = round(min(escalation_score * (7.0 / 6.65), 7.0), 2)

    # --- Risk level thresholds (calibrated) ---
    if escalation_score >= 5.5:
        risk_level = "Critical"
        protocol   = "Immediate referral to a mental health professional. Do not delay. Call a crisis helpline if needed."
        color_code = "#DC2626"
        action     = "ESCALATE_IMMEDIATELY"
    elif escalation_score >= 3.8:
        risk_level = "High"
        protocol   = "Schedule a professional consultation within 48–72 hours. Limit stressors and engage your support network."
        color_code = "#EA580C"
        action     = "URGENT_REFERRAL"
    elif escalation_score >= 2.4:
        risk_level = "Moderate"
        protocol   = "Structured self-care and counseling recommended within 1–2 weeks. Monitor symptoms regularly."
        color_code = "#D97706"
        action     = "MONITOR_AND_SUPPORT"
    elif escalation_score >= 1.2:
        risk_level = "Low-Moderate"
        protocol   = "Encourage lifestyle interventions (sleep, exercise, mindfulness). Re-screen in 4 weeks."
        color_code = "#65A30D"
        action     = "PREVENTIVE_CARE"
    else:
        risk_level = "Low"
        protocol   = "Continue current wellness practices. Re-screen in 3 months."
        color_code = "#16A34A"
        action     = "WELLNESS_MAINTENANCE"

    return {
        "risk_level":       risk_level,
        "escalation_score": escalation_score,
        "protocol":         protocol,
        "color_code":       color_code,
        "action_code":      action,
        "score_breakdown": {
            "ml_component":      round(ml_score * 0.35, 3),
            "raw_score_component": round(raw_score * 0.25, 3),
            "mhi_component":     round(mhi_score * 0.10, 3),
            "warning_component": round(warning_score * 0.20, 3),
            "item_flags":        round(item_score * 0.10, 3),
        }
    }


# ============================================================
# TEMPORAL ANALYSIS — Longitudinal trend computation
# ============================================================
def compute_temporal_analysis(history: list[dict]) -> dict:
    """
    Analyzes longitudinal assessment data for trends, trajectories,
    and deterioration detection.
    """
    if len(history) < 2:
        return {
            "sufficient_data": False,
            "message": "At least 2 sessions required for temporal analysis.",
        }

    phq_scores  = [h["phq_score"]  for h in history]
    gad_scores  = [h["gad_score"]  for h in history]
    mhi_scores  = [h["mhi_score"]  for h in history]
    risk_levels = [h["risk_level"] for h in history]

    # Delta computations
    phq_delta   = phq_scores[-1]  - phq_scores[0]
    gad_delta   = gad_scores[-1]  - gad_scores[0]
    mhi_delta   = mhi_scores[-1]  - mhi_scores[0]

    # Recent trajectory (last 3 sessions vs previous)
    recent_n = min(3, len(history) // 2)
    if recent_n >= 1:
        recent_mhi_avg   = sum(mhi_scores[-recent_n:]) / recent_n
        previous_mhi_avg = sum(mhi_scores[:recent_n]) / recent_n
        recent_trajectory_delta = recent_mhi_avg - previous_mhi_avg
    else:
        recent_trajectory_delta = mhi_delta

    # Deterioration flag: significant worsening in recent sessions
    deterioration_flag = (
        recent_trajectory_delta < -10 or
        (phq_delta > 8 and gad_delta > 5)
    )

    # Risk escalation over time
    risk_rank = {"Low": 0, "Low-Moderate": 1, "Moderate": 2, "High": 3, "Critical": 4}
    risk_trajectory = [risk_rank.get(r, 0) for r in risk_levels]
    risk_worsened = len(risk_trajectory) >= 2 and risk_trajectory[-1] > risk_trajectory[0]

    # Consecutive high-risk streak
    risk_streak_level = risk_levels[-1]
    risk_streak_count = 1
    for i in range(len(risk_levels) - 2, -1, -1):
        if risk_levels[i] == risk_streak_level:
            risk_streak_count += 1
        else:
            break

    # Overall trend direction
    if mhi_delta > 8:
        trend_direction = "Improving"
    elif mhi_delta < -8:
        trend_direction = "Deteriorating"
    else:
        trend_direction = "Stable"

    # Volatility — std deviation of MHI
    avg_mhi = sum(mhi_scores) / len(mhi_scores)
    variance = sum((x - avg_mhi) ** 2 for x in mhi_scores) / len(mhi_scores)
    mhi_volatility = round(variance ** 0.5, 2)
    volatility_label = "High" if mhi_volatility > 15 else ("Moderate" if mhi_volatility > 7 else "Low")

    return {
        "sufficient_data":         True,
        "total_sessions":          len(history),
        "trend_direction":         trend_direction,
        "mhi_change":              round(mhi_delta, 2),
        "mhi_change_recent":       round(recent_trajectory_delta, 2),
        "phq_change":              phq_delta,
        "gad_change":              gad_delta,
        "deterioration_flag":      deterioration_flag,
        "risk_worsened":           risk_worsened,
        "risk_streak":             {"count": risk_streak_count, "level": risk_streak_level},
        "mhi_volatility":          mhi_volatility,
        "volatility_label":        volatility_label,
        "avg_mhi":                 round(avg_mhi, 2),
        "first_mhi":               mhi_scores[0],
        "latest_mhi":              mhi_scores[-1],
        "peak_mhi":                max(mhi_scores),
        "lowest_mhi":              min(mhi_scores),
    }


# ============================================================
# AI RECOMMENDATION — Improved Prompt Engineering
# ============================================================
def generate_ai_recommendation(
    dep_pred:         int,
    anx_pred:         int,
    phq_score:        int,
    gad_score:        int,
    mhi:              dict,
    warning:          dict,
    escalation:       dict,
    top_dep_features: list,
    top_anx_features: list,
    data:             MentalInput,
) -> str:
    try:
        score_labels = {0: "Not at all", 1: "Several days", 2: "More than half the days", 3: "Nearly every day"}

        phq_map = {
            "Little interest/pleasure":  data.phq_little_interest,
            "Feeling down/hopeless":     data.phq_feeling_down,
            "Sleep problems":            data.phq_sleep_issues,
            "Low energy/fatigue":        data.phq_low_energy,
            "Appetite changes":          data.phq_appetite,
            "Feeling like a failure":    data.phq_self_worth,
            "Concentration difficulty":  data.phq_concentration,
            "Psychomotor changes":       data.phq_psychomotor,
            "Thoughts of self-harm":     data.phq_suicidal_thoughts,
        }
        gad_map = {
            "Feeling nervous/on edge":   data.gad_nervous,
            "Uncontrollable worry":      data.gad_uncontrollable_worry,
            "Excessive worry":           data.gad_excessive_worry,
            "Trouble relaxing":          data.gad_trouble_relaxing,
            "Restlessness":              data.gad_restlessness,
            "Irritability":              data.gad_irritability,
            "Feeling of dread/fear":     data.gad_fear,
        }

        # Only show symptoms that were endorsed (score >= 1)
        phq_snapshot = "\n".join(
            f"    - {k}: {score_labels[v]}" for k, v in phq_map.items() if v >= 1
        ) or "    - No significant depression symptoms reported"

        gad_snapshot = "\n".join(
            f"    - {k}: {score_labels[v]}" for k, v in gad_map.items() if v >= 1
        ) or "    - No significant anxiety symptoms reported"

        # Top SHAP symptoms with natural language labels
        def format_shap_features(features):
            lines = []
            for f in features[:3]:
                label  = f.get("clinical_label", f["feature"].replace("_", " "))
                impact = abs(f.get("impact", 0))
                level  = "strongly" if impact > 0.3 else ("moderately" if impact > 0.1 else "somewhat")
                lines.append(f"  • {label.capitalize()} ({level} influences the prediction)")
            return "\n".join(lines) if lines else "  • No dominant drivers identified"

        dep_symptom_detail = format_shap_features(top_dep_features)
        anx_symptom_detail = format_shap_features(top_anx_features)

        # Warning context
        warning_context = ""
        if warning["total_warnings"] > 0:
            if warning["warning_level"] == "Critical":
                warning_context = (
                    "\n⚠️ CRITICAL CLINICAL ALERT: This person has reported thoughts of self-harm "
                    "or feelings of worthlessness at a clinically significant level. "
                    "Your response MUST explicitly encourage immediate professional help or crisis support "
                    "without alarming language. Do this warmly and urgently.\n"
                )
            elif warning["warning_level"] == "Warning":
                msgs = [w["message"] for w in warning["warnings"]]
                warning_context = f"\nCLINICAL NOTE: {'; '.join(msgs)}\n"

        dep_label = DEP_SEVERITY_LABELS.get(dep_pred, "severe depression")
        anx_label = ANX_SEVERITY_LABELS.get(anx_pred, "severe anxiety")

        # Demographic context
        demo_context = []
        if 0 < data.age <= 19:
            demo_context.append(f"This person is {data.age} years old — a teenager. Use relatable, age-appropriate language. Avoid overly clinical terms.")
        elif 0 < data.age <= 25:
            demo_context.append(f"This person is {data.age} years old — a young adult. Acknowledge pressures like academic stress, career uncertainty, and social comparison.")
        elif data.age > 25:
            demo_context.append(f"This person is {data.age} years old. Use adult-appropriate, professional language.")

        if data.gender in ["Female", "Non-binary / Gender non-conforming"]:
            demo_context.append("Be sensitive to gender-specific mental health experiences.")

        if data.stress_source and data.stress_source != "Nothing significant right now":
            demo_context.append(f"Their primary stressor is: {data.stress_source}. Reference this directly.")

        if data.sleep_pattern and "healthy" not in data.sleep_pattern.lower():
            demo_context.append(f"Sleep pattern: {data.sleep_pattern} — sleep is a major factor for them.")

        if data.mental_history and "No previous" not in data.mental_history:
            demo_context.append(f"Mental health history: {data.mental_history}. Acknowledge this context sensitively.")

        if data.support_system:
            demo_context.append(f"Support system: {data.support_system}. Tailor advice accordingly.")

        if data.stressful_events and data.stressful_events.strip():
            demo_context.append(f"Recent stressful event reported: {data.stressful_events[:200]}")

        demo_str = "\n".join(f"- {d}" for d in demo_context) if demo_context else "- No specific demographic context provided"

        # Calibrate tone by risk level
        if escalation["risk_level"] == "Critical":
            tone_instruction = "Use a calm, warm, urgent tone. Do not minimize their distress. Make seeking help feel safe and non-judgmental."
        elif escalation["risk_level"] == "High":
            tone_instruction = "Use a warm, concerned tone. Emphasize that professional support is genuinely helpful, not a sign of weakness."
        elif escalation["risk_level"] == "Moderate":
            tone_instruction = "Use an empathetic, encouraging tone. Validate their experience while providing practical strategies."
        else:
            tone_instruction = "Use a warm, positive, supportive tone. Celebrate any current wellness while offering preventive guidance."

        system_prompt = f"""You are MindPulse — a compassionate mental wellness guide. You write like a knowledgeable friend who genuinely knows this person's situation. Your responses feel human, specific, and deeply personal.

ABSOLUTE RULES:
1. No diagnoses, no medications, no clinical jargon (no "DSM-5", "comorbidity", "psychopathology").
2. Never say "AI", "algorithm", "model", "SHAP", "machine learning", or "data".
3. ZERO generic advice — if a sentence could apply to any random person, delete it and rewrite it about THIS person.
4. Do NOT open with "It takes courage", "I understand how you feel", or any formulaic empathy.
5. No markdown (no **, ##, -, *). Plain paragraph text only.
6. Write 380–450 words total. Each section 60–100 words. More depth = more useful.
7. Tone: {tone_instruction}
8. Use the person's actual reported stressor, sleep issue, and support system in EVERY section.
9. Name specific symptoms from their answers. If they reported financial stress, mention money/loans/expenses by name.
10. The writing should feel like it was written specifically for this one person, not adapted from a template.

SECTION FORMAT — write EXACTLY these 5 headers as plain text (no symbols before/after):
How You May Be Feeling
What Your Scores Indicate
Strategies for Your Symptoms
Daily Practices to Support You
When to Reach Out for Help

SECTION REQUIREMENTS:
Section 1 (How You May Be Feeling): Paint a specific picture of their emotional state using their exact symptoms and stressor. Name the feelings they likely have. Use second-person ("you") warmly. Reference their specific stressor (financial stress, work pressure, etc.) and how it's linking to their symptoms.
Section 2 (What Your Scores Indicate): Explain what their PHQ-9 and GAD-7 numbers mean in human terms — not "you score moderate" but "carrying this level of worry day-to-day is genuinely exhausting and makes sense given what you've described." Mention their MHI score improvement/level as a positive signal if applicable.
Section 3 (Strategies for Your Symptoms): Give exactly 3 techniques, each directly tied to a named symptom from their profile. E.g., "For the concentration difficulties you mentioned..." or "To address the restlessness you're experiencing..." Each technique should be actionable, specific, and referenced to their symptom. Not generic CBT advice.
Section 4 (Daily Practices to Support You): Tailor 3 habits directly to their reported stressor, sleep pattern, and support system. If they have strong support, say "lean on [support type] specifically by..." If their sleep is poor, give a targeted sleep practice. If financial stress, address that context directly.
Section 5 (When to Reach Out for Help): Match urgency precisely to risk level. Low risk: normalize professional help as growth, not crisis. Moderate: "given what you've shared about [stressor]." High/Critical: be warm but direct about immediate professional support."""

        user_prompt = f"""Write a personalized mental wellness response for this specific person.

PERSON CONTEXT:
{demo_str}

ASSESSMENT SCORES:
- PHQ-9 Depression: {phq_score}/27 — classified as {dep_label}
- GAD-7 Anxiety: {gad_score}/21 — classified as {anx_label}
- Mental Health Index (MHI): {mhi['mhi_score']}/100 — {mhi['mhi_label']} wellness
- Risk Level: {escalation['risk_level']} (score: {escalation['escalation_score']}/7)
- Clinical Protocol: {escalation['protocol']}

SYMPTOMS THEY REPORTED (PHQ-9):
{phq_snapshot}

SYMPTOMS THEY REPORTED (GAD-7):
{gad_snapshot}

THEIR MOST IMPACTFUL DEPRESSION SYMPTOMS (AI-identified):
{dep_symptom_detail}

THEIR MOST IMPACTFUL ANXIETY SYMPTOMS (AI-identified):
{anx_symptom_detail}
{warning_context}
Write a response that directly addresses their specific symptoms above.
Do NOT write generic mental health advice.
Do NOT use any markdown or bullet points.
Reference their specific symptoms by name in your strategies."""

        chat = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.35,
            max_tokens=750,
        )
        return chat.choices[0].message.content

    except Exception as e:
        print(f"\n🚨 GROQ ERROR: {e}")
        return "AI recommendations temporarily unavailable. Please consult a mental health professional for guidance."


# ============================================================
# AUTH — USERS TABLE + SIGNUP + LOGIN
# ============================================================
import bcrypt, jwt, re as _re
from datetime import timedelta
from fastapi import HTTPException as _HTTPException

_JWT_SECRET  = os.getenv("JWT_SECRET", "mindpulse-jwt-secret-change-me")
_USERNAME_RE = _re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.]{2,29}$")
_EMAIL_RE    = _re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def _make_token(uid: int, username: str, email: str) -> str:
    payload = {
        "sub":      str(uid),
        "username": username,
        "email":    email,
        "exp":      datetime.utcnow() + timedelta(hours=24),
    }
    return jwt.encode(payload, _JWT_SECRET, algorithm="HS256")

class _SignupReq(BaseModel):
    full_name: str
    username:  str
    email:     str
    phone:     str
    password:  str

class _LoginReq(BaseModel):
    identifier: str   # username OR email
    password:   str

@app.post("/auth/signup")
def signup(req: _SignupReq):
    name     = req.full_name.strip()
    username = req.username.strip().lower()
    email    = req.email.strip().lower()
    phone    = req.phone.strip()
    pw       = req.password

    errs = {}
    if len(name) < 2:                    errs["full_name"] = "Name must be at least 2 characters"
    if not _USERNAME_RE.match(username): errs["username"]  = "3–30 chars, start with letter/number, only a–z 0–9 _ . allowed"
    if not _EMAIL_RE.match(email):       errs["email"]     = "Enter a valid email address"
    digits = _re.sub(r"\D", "", phone)
    if phone != "N/A" and len(digits) < 10: errs["phone"] = "Enter a valid phone number (min 10 digits)"
    if len(pw) < 8:                      errs["password"]  = "Password must be at least 8 characters"
    if not any(c.isdigit() for c in pw): errs["password"]  = "Password must include at least 1 number"
    if errs:
        raise _HTTPException(status_code=422, detail=errs)

    pw_hash = bcrypt.hashpw(pw.encode(), bcrypt.gensalt(12)).decode()
    try:
        conn = get_db_connection()
        cur  = conn.cursor(dictionary=True)
        cur.execute("SELECT id, email, username FROM users WHERE email=%s OR username=%s", (email, username))
        dup = cur.fetchone()
        if dup:
            field = "email" if dup["email"] == email else "username"
            msg   = "Email already registered" if field == "email" else "Username already taken"
            cur.close(); conn.close()
            raise _HTTPException(status_code=409, detail={field: msg})
        cur.execute(
            "INSERT INTO users (full_name, username, email, phone, password_hash) VALUES (%s,%s,%s,%s,%s)",
            (name, username, email, phone, pw_hash),
        )
        conn.commit()
        uid = cur.lastrowid
        cur.close(); conn.close()
    except _HTTPException:
        raise
    except Exception as e:
        raise _HTTPException(status_code=500, detail=f"Database error: {e}")

    return {
        "token": _make_token(uid, username, email),
        "user":  {"id": uid, "full_name": name, "username": username, "email": email, "phone": phone},
    }

@app.post("/auth/login")
def login(req: _LoginReq):
    ident = req.identifier.strip().lower()
    try:
        conn = get_db_connection()
        cur  = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM users WHERE email=%s OR username=%s", (ident, ident))
        user = cur.fetchone(); cur.close(); conn.close()
    except Exception as e:
        raise _HTTPException(status_code=500, detail=f"Database error: {e}")

    if not user:
        raise _HTTPException(status_code=401, detail="No account found with that email or username")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise _HTTPException(status_code=401, detail="Incorrect password")

    return {
        "token": _make_token(user["id"], user["username"], user["email"]),
        "user":  {
            "id":        user["id"],
            "full_name": user["full_name"],
            "username":  user["username"],
            "email":     user["email"],
            "phone":     user["phone"],
        },
    }


# ============================================================
# /health ENDPOINT
# ============================================================
@app.get("/health")
def health_check():
    db_ok = False
    try:
        conn = get_db_connection()
        conn.ping(reconnect=False)
        conn.close()
        db_ok = True
    except Exception:
        pass
    return {
        "status":    "ok" if db_ok else "degraded",
        "db":        "connected" if db_ok else "unavailable",
        "timestamp": datetime.now().isoformat(),
    }


# ============================================================
# /predict ENDPOINT
# ============================================================
@app.post("/predict")
def predict(data: MentalInput):

    values = build_feature_vector(data)

    dep_pred  = int(dep_model.predict(values)[0])
    anx_pred  = int(anx_model.predict(values)[0])

    # ── Clinical override: cap ML predictions to clinically valid ranges ──────
    # PHQ-9: 0-4→Minimal(0), 5-9→Mild(1), 10-14→Moderate(2), 15+→Severe(3)
    # GAD-7: 0-4→Minimal(0), 5-9→Mild(1), 10-14→Moderate(2), 15+→Severe(3)
    def _phq_clinical_max(score: int) -> int:
        if score <= 4:  return 0
        if score <= 9:  return 1
        if score <= 14: return 2
        return 3

    def _gad_clinical_max(score: int) -> int:
        if score <= 4:  return 0
        if score <= 9:  return 1
        if score <= 14: return 2
        return 3

    dep_pred = min(dep_pred, _phq_clinical_max(data.phq_total_score))
    anx_pred = min(anx_pred, _gad_clinical_max(data.gad_total_score))

    dep_probs  = dep_model.predict_proba(values)[0]
    anx_probs  = anx_model.predict_proba(values)[0]
    confidence = round(((float(max(dep_probs)) + float(max(anx_probs))) / 2) * 100, 2)

    # Domain-filtered SHAP: depression model → only PHQ symptom features
    #                        anxiety model   → only GAD symptom features
    top_dep_features = get_shap_top_features(dep_explainer, values, n=5, domain_filter=PHQ_FEATURES)
    top_anx_features = get_shap_top_features(anx_explainer, values, n=5, domain_filter=GAD_FEATURES)

    # All SHAP values for full chart visualization (no domain filter)
    all_dep_shap = get_all_shap_values(dep_explainer, values)
    all_anx_shap = get_all_shap_values(anx_explainer, values)

    mhi        = compute_mhi(data.phq_total_score, data.gad_total_score)
    warning    = early_warning_detection(data)
    escalation = risk_escalation_engine(
        dep_pred, anx_pred, mhi, warning,
        data.phq_total_score, data.gad_total_score,
        data=data,
    )

    ai_text = generate_ai_recommendation(
        dep_pred=dep_pred,
        anx_pred=anx_pred,
        phq_score=data.phq_total_score,
        gad_score=data.gad_total_score,
        mhi=mhi,
        warning=warning,
        escalation=escalation,
        top_dep_features=top_dep_features,
        top_anx_features=top_anx_features,
        data=data,
    )

    # ── Persist to DB (all fields, AI text EXCLUDED from storage) ──
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO assessments (
                user_name, user_email, age, gender,
                education, occupation, sleep_pattern, stress_source,
                mental_history, support_system, stressful_events,
                phq_q1, phq_q2, phq_q3, phq_q4, phq_q5,
                phq_q6, phq_q7, phq_q8, phq_q9, phq_score,
                gad_q1, gad_q2, gad_q3, gad_q4, gad_q5, gad_q6, gad_q7,
                gad_score,
                depression_level, anxiety_level, confidence_pct, risk_level,
                mhi_score, mhi_label, escalation_score, warning_level,
                created_at
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s,
                %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s
            )
        """, (
            data.user_name, data.user_email, data.age, data.gender,
            data.education, data.occupation, data.sleep_pattern, data.stress_source,
            data.mental_history, data.support_system, data.stressful_events,
            data.phq_little_interest, data.phq_feeling_down,
            data.phq_sleep_issues, data.phq_low_energy, data.phq_appetite,
            data.phq_self_worth, data.phq_concentration,
            data.phq_psychomotor, data.phq_suicidal_thoughts,
            data.phq_total_score,
            data.gad_nervous, data.gad_uncontrollable_worry,
            data.gad_excessive_worry, data.gad_trouble_relaxing,
            data.gad_restlessness, data.gad_irritability, data.gad_fear,
            data.gad_total_score,
            dep_pred, anx_pred, round(float(confidence), 2), escalation["risk_level"],
            mhi["mhi_score"], mhi["mhi_label"],
            escalation["escalation_score"], warning["warning_level"],
            datetime.now(),
        ))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"⚠️ DB Insert Error: {e}")

    return {
        "depression_severity":    dep_pred,
        "anxiety_severity":       anx_pred,
        "confidence_percentage":  confidence,
        "top_depression_factors": top_dep_features,
        "top_anxiety_factors":    top_anx_features,
        "all_depression_shap":    all_dep_shap,
        "all_anxiety_shap":       all_anx_shap,
        "mental_health_index":    mhi,
        "early_warning":          warning,
        "risk_escalation":        escalation,
        "ai_recommendation":      ai_text,
    }


# ============================================================
# /explain ENDPOINT
# ============================================================
@app.post("/explain")
def explain_prediction(data: MentalInput):
    values   = build_feature_vector(data)
    dep_pred = int(dep_model.predict(values)[0])
    anx_pred = int(anx_model.predict(values)[0])

    top_dep = get_shap_top_features(dep_explainer, values, n=5, domain_filter=PHQ_FEATURES)
    top_anx = get_shap_top_features(anx_explainer, values, n=5, domain_filter=GAD_FEATURES)
    all_dep_shap = get_all_shap_values(dep_explainer, values)
    all_anx_shap = get_all_shap_values(anx_explainer, values)

    mhi        = compute_mhi(data.phq_total_score, data.gad_total_score)
    warning    = early_warning_detection(data)
    escalation = risk_escalation_engine(
        dep_pred, anx_pred, mhi, warning,
        data.phq_total_score, data.gad_total_score,
        data=data,
    )

    return {
        "depression_prediction":  dep_pred,
        "anxiety_prediction":     anx_pred,
        "top_depression_drivers": top_dep,
        "top_anxiety_drivers":    top_anx,
        "all_depression_shap":    all_dep_shap,
        "all_anxiety_shap":       all_anx_shap,
        "mental_health_index":    mhi,
        "early_warning":          warning,
        "risk_escalation":        escalation,
    }


# ============================================================
# /trend ENDPOINT — With temporal analysis
# ============================================================
@app.get("/trend/{user_email}")
def get_trend(user_email: str):
    try:
        conn = get_db_connection()
        cur  = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT phq_score, gad_score, risk_level,
                   mhi_score, mhi_label, escalation_score,
                   warning_level, created_at
            FROM assessments
            WHERE user_email = %s
            ORDER BY created_at ASC
            LIMIT 20
        """, (user_email,))
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return {
                "user_email":      user_email,
                "trend":           [],
                "trend_direction": "No data",
                "total_sessions":  0,
                "mhi_change":      None,
                "risk_streak":     {"count": 0, "level": None},
                "temporal":        {"sufficient_data": False},
            }

        history = []
        for idx, row in enumerate(rows):
            if row["mhi_score"]:
                mhi_score = row["mhi_score"]
                mhi_label = row["mhi_label"] or "Unknown"
            else:
                computed  = compute_mhi(row["phq_score"], row["gad_score"])
                mhi_score = computed["mhi_score"]
                mhi_label = computed["mhi_label"]

            history.append({
                "date":             row["created_at"].strftime("%Y-%m-%d %H:%M"),
                "date_display":     row["created_at"].strftime("%b %d, %H:%M"),  # "Feb 24, 14:30"
                "session_number":   idx + 1,
                "session_label":    f"Session {idx + 1}",
                "phq_score":        row["phq_score"],
                "gad_score":        row["gad_score"],
                "mhi_score":        mhi_score,
                "mhi_label":        mhi_label,
                "escalation_score": row["escalation_score"],
                "warning_level":    row["warning_level"],
                "risk_level":       row["risk_level"],
            })

        temporal = compute_temporal_analysis(history)

        trend_direction = temporal.get("trend_direction", "Insufficient data")
        mhi_change      = temporal.get("mhi_change", None)

        risk_streak_count = temporal.get("risk_streak", {}).get("count", 1)
        risk_streak_level = temporal.get("risk_streak", {}).get("level", None)

        return {
            "user_email":      user_email,
            "trend":           history,
            "trend_direction": trend_direction,
            "mhi_change":      mhi_change,
            "risk_streak": {
                "count": risk_streak_count,
                "level": risk_streak_level,
            },
            "total_sessions":  len(history),
            "temporal":        temporal,
        }

    except Exception as e:
        return {"error": str(e), "user_email": user_email, "trend": [], "total_sessions": 0}


# -------------------- HOME --------------------
@app.get("/")
def home():
    return {
        "message": "MindPulse AI Backend Running",
        "version": "2.1.0",
        "docs":    "/docs",
    }