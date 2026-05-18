from sklearn.feature_extraction.text import TfidfVectorizer
from flask import Flask, render_template, request
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

app = Flask(__name__)
history = []

def clean_text(sentence):
    sentence = sentence.lower()

    # remove punctuation (basic)
    import re
    sentence = re.sub(r'[^\w\s]', '', sentence)

    return sentence.strip()
import pandas as pd

df = pd.read_excel("Bhaav-Dataset.xlsx")

dataset_sentences = []
dataset_labels = []

label_map = {
    0: "anger",
    1: "happy",
    2: "sad",
    3: "surprise",
    4: "neutral"
}

for i in range(len(df)):
    sentence = str(df["Sentences"][i])
    label = df["Annotation"][i]

    if label in label_map:
        dataset_sentences.append(sentence)
        dataset_labels.append(label_map[label])

vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=8000)
dataset_sentences = [clean_text(s) for s in dataset_sentences]
X_train = vectorizer.fit_transform(dataset_sentences)

from sklearn.linear_model import LogisticRegression
model = LogisticRegression(max_iter=300, class_weight='balanced')
model.fit(X_train, dataset_labels)

def predict_emotion(text):
    cleaned = clean_text(text)
    X_input = vectorizer.transform([cleaned])
    prediction = model.predict(X_input)
    probabilities = model.predict_proba(X_input)[0]
    emotions = model.classes_
    plt.figure(figsize=(6, 4))

    plt.bar(emotions, probabilities)

    plt.xlabel("Emotions")
    plt.ylabel("Confidence")

    plt.title("Emotion Prediction Graph")
    graph_path = "static/emotion_graph.png"
    plt.savefig(graph_path)
    plt.close()

    return prediction[0], graph_path

@app.route("/", methods=["GET", "POST"])
def home():
    result = ""
    graph = ""
    if request.method == "POST":
        sentences = request.form["text"]
        print("User input:", sentences)
        result, graph = predict_emotion(sentences)
        history.append({
            "text": sentences,
            "emotion": result
        })

    return render_template(
        "project.html",
        result=result,
        graph=graph,
        history=history
    )
if __name__ == "__main__":
    app.run(debug=True)