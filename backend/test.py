# paste into a quick test.py and run: python test.py
import joblib
import numpy as np

dep_model = joblib.load("depression_model.pkl")
anx_model = joblib.load("anxiety_model.pkl")

print("DEP n_features:", dep_model.n_features_in_)
print("ANX n_features:", anx_model.n_features_in_)
print("DEP classes:", dep_model.classes_)
print("ANX classes:", anx_model.classes_)

# Check feature names if model has them
if hasattr(dep_model, 'feature_names_in_'):
    print("DEP feature names:", list(dep_model.feature_names_in_))
if hasattr(anx_model, 'feature_names_in_'):
    print("ANX feature names:", list(anx_model.feature_names_in_))