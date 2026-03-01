import json
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

# Setup paths
BASE_DIR = Path(__file__).resolve().parents[1]
MODELS_DIR = BASE_DIR / "data" / "models"
OUTPUT_DIR = BASE_DIR / "data" / "benchmarks"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Data from previous run (hardcoded for consistency with what user saw)
metrics = {
    "Diabetes": {"auc": 0.5257, "accuracy": 0.90},
    "Hypertension": {"auc": 0.6057, "accuracy": 0.84},
    "Heart Disease": {"auc": 0.6241, "accuracy": 0.79}
}

def generate_auc_chart():
    names = list(metrics.keys())
    aucs = [m["auc"] for m in metrics.values()]
    
    plt.figure(figsize=(10, 6))
    bars = plt.bar(names, aucs, color=['#007aff', '#34c759', '#ff9500'])
    
    plt.ylim(0, 1.0)
    plt.title('Model Performance: ROC-AUC', fontsize=16, fontweight='bold', pad=20)
    plt.ylabel('ROC-AUC Score', fontsize=12)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    
    # Add labels on top of bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height + 0.02,
                 f'{height:.4f}', ha='center', va='bottom', fontsize=12, fontweight='bold')
    
    # Add target range indicator
    plt.axhspan(0.78, 0.88, color='green', alpha=0.1, label='Target Realistic Range')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "auc_performance.png", dpi=300)
    print(f"Generated: {OUTPUT_DIR / 'auc_performance.png'}")
    plt.close()

def generate_feature_importance_charts():
    diseases = ["diabetes", "hypertension", "heart_disease"]
    
    for disease in diseases:
        fi_path = MODELS_DIR / f"{disease}_feature_importance.json"
        if not fi_path.exists():
            print(f"Skipping {disease}: Feature importance file not found.")
            continue
            
        with open(fi_path, 'r') as f:
            fi = json.load(f)
            
        # Get top 10 features
        top_features = list(fi.keys())[:10]
        top_scores = [fi[k] for k in top_features]
        
        # Reverse for horizontal bar chart
        top_features.reverse()
        top_scores.reverse()
        
        plt.figure(figsize=(12, 8))
        color = '#007aff' if disease == "diabetes" else '#34c759' if disease == "hypertension" else '#ff9500'
        
        plt.barh(top_features, top_scores, color=color)
        plt.title(f'Top 10 Feature Contributions: {disease.replace("_", " ").upper()}', fontsize=16, fontweight='bold', pad=20)
        plt.xlabel('Importance Score', fontsize=12)
        plt.grid(axis='x', linestyle='--', alpha=0.7)
        
        plt.tight_layout()
        plt.savefig(OUTPUT_DIR / f"{disease}_fi.png", dpi=300)
        print(f"Generated: {OUTPUT_DIR / f'{disease}_fi.png'}")
        plt.close()

if __name__ == "__main__":
    print("Generating performance charts...")
    generate_auc_chart()
    generate_feature_importance_charts()
    print("Done!")
