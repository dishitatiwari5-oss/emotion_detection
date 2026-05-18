import string
import nltk
nltk.download('stopwords')

from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from flask import Flask, render_template, request

app = Flask(__name__)

data = [
    # happy
    ("I am feeling very happy today", "happy"),
    ("I am so excited today", "happy"),
    ("I am smiling a lot", "happy"),
    ("This is a great day", "happy"),
    ("this is good","happy"),

    # sad
    ("I feel so sad and lonely", "sad"),
    ("I am crying", "sad"),
    ("I feel very low", "sad"),
    ("I am depressed", "sad"),
    ("this is bad","sad"),

    # anger
    ("Everything is going wrong today", "anger"),
    ("I am very angry", "anger"),
    ("This is frustrating", "anger"),
    ("I hate this", "anger"),

    # fear
    ("I am scared about tomorrow's exam", "fear"),
    ("I feel nervous", "fear"),
    ("I am afraid", "fear"),
    ("This makes me anxious", "fear"),

    # love
    ("I love spending time with my family", "love"),
    ("I care about you", "love"),
    ("I adore this", "love"),
    ("I feel loved", "love"),

    # surprise
    ("I am surprised by the news", "surprise"),
    ("Oh wow this is unexpected", "surprise"),
    ("This shocked me", "surprise"),

    # disgust
    ("I am disgusted by this behavior", "disgust"),
    ("This is so gross", "disgust"),
    ("I feel sick seeing this", "disgust")
]

def clean_text(sentence):
    sentence = sentence.lower()

    punctuation = string.punctuation
    container = []

    for char in sentence:
        if char not in punctuation:
            container.append(char)

    clean_sentence = "".join(container)
    words = clean_sentence.split()

    stop_words = set(stopwords.words('english'))
    negations = {"not", "no", "never", "n't"}
    stop_words = stop_words - negations

    sen = []
    for word in words:
        if word not in stop_words:
            sen.append(word)

    return " ".join(sen)

dataset_sentences = []
dataset_labels = []

for sentence, emotion in data:
    cleaned = clean_text(sentence)
    dataset_sentences.append(cleaned)
    dataset_labels.append(emotion)

vectorizer = TfidfVectorizer(ngram_range=(1,2), max_features=5000)
X_train = vectorizer.fit_transform(dataset_sentences)

from sklearn.linear_model import LogisticRegression
model = LogisticRegression(max_iter=300, class_weight='balanced')
model.fit(X_train, dataset_labels)

def predict_emotion(text):
    text_lower = text.lower()

    if "not happy" in text_lower:
        return "sad"
    if "not sad" in text_lower:
        return "happy"
    if "not good" in text_lower:
        return "sad"
    if "not angry" in text_lower:
        return "happy"
    if "not bad" in text_lower:
        return "happy"

    cleaned = clean_text(text)
    X_input = vectorizer.transform([cleaned])
    prediction = model.predict(X_input)
    return prediction[0]

@app.route("/", methods=["GET", "POST"])
def home():
    result = ""
    if request.method == "POST":
        sentences = request.form["text"]
        print("User input:", sentences)
        result = predict_emotion(sentences)
        print("Prediction:", result)

    return render_template("project.html", result=result)
if __name__ == "__main__":
    app.run(debug=True)