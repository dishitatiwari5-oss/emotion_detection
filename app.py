import os
import re
import uuid
from datetime import datetime
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from flask import Flask, render_template, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

app = Flask(__name__)

# Initialize model and history
history = []
model = None
vectorizer = None

label_map = {
    0: "anger",
    1: "happy",
    2: "sad",
    3: "surprise",
    4: "neutral"
}

def clean_text(sentence):
    sentence = str(sentence).lower()
    sentence = re.sub(r'[^\w\s]', '', sentence)
    return sentence.strip()

def initialize_model():
    global model, vectorizer
    print("Loading dataset and training model...")
    df = pd.read_csv("Bhaav-Dataset.csv")
    
    dataset_sentences = []
    dataset_labels = []
    
    for i in range(len(df)):
        sentence = str(df["text"][i])
        label = df["label"][i]
        if label in label_map:
            dataset_sentences.append(clean_text(sentence))
            dataset_labels.append(label_map[label])
            
    vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=8000)
    X_train = vectorizer.fit_transform(dataset_sentences)
    
    model = LogisticRegression(max_iter=300, class_weight='balanced')
    model.fit(X_train, dataset_labels)
    print("Model training complete.")

# Initialize model before serving requests
initialize_model()

# Ensure graph directory exists
os.makedirs(os.path.join("static", "graphs"), exist_ok=True)

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")
    
    if not text.strip():
        return jsonify({"error": "No text provided"}), 400
        
    cleaned = clean_text(text)
    X_input = vectorizer.transform([cleaned])
    prediction = model.predict(X_input)[0]
    probabilities = model.predict_proba(X_input)[0]
    emotions = model.classes_
    
    # Generate graph
    graph_id = str(uuid.uuid4())
    graph_filename = f"{graph_id}.png"
    graph_path = os.path.join("static", "graphs", graph_filename)
    
    plt.figure(figsize=(6, 4))
    
    # Stylish theme-aligned colors mapped dynamically
    colors_map = {
        'anger': '#ef4444',
        'happy': '#06b6d4',
        'sad': '#6b7280',
        'surprise': '#eab308',
        'neutral': '#9ca3af'
    }
    bar_colors = [colors_map.get(emotion.lower(), '#8b5cf6') for emotion in emotions]
    
    plt.bar(emotions, probabilities, color=bar_colors, width=0.6)
    
    plt.xlabel("Emotions", fontsize=11, fontweight='semibold', color='#4b5563')
    plt.ylabel("Confidence", fontsize=11, fontweight='semibold', color='#4b5563')
    plt.title("Confidence Scores", fontsize=13, fontweight='bold', color='#111827', pad=15)
    
    # Clean up plot styling
    ax = plt.gca()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#d1d5db')
    ax.spines['bottom'].set_color('#d1d5db')
    ax.tick_params(colors='#4b5563', labelsize=10)
    
    plt.tight_layout()
    plt.savefig(graph_path, transparent=True)
    plt.close()
    
    # Convert probabilities to a dict for the response
    probs_dict = {emotion: float(prob) for emotion, prob in zip(emotions, probabilities)}
    
    result = {
        "text": text,
        "emotion": prediction,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "graph_url": f"/static/graphs/{graph_filename}",
        "probabilities": probs_dict
    }
    
    # Prepend to history
    history.insert(0, result)
    
    return jsonify(result)

@app.route("/history", methods=["GET"])
def get_history():
    return jsonify({"history": history})

@app.route("/clear_history", methods=["POST"])
def clear_history():
    global history
    history = []
    # Optionally delete the graph files from static/graphs/ here if needed, but not strictly required
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)
