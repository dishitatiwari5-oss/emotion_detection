# Preprocess function
def preprocess(text):
    text = text.lower()
    text = "".join([char for char in text if char not in string.punctuation])
    words = text.split()
    words = [w for w in words if w not in stopwords.words('english')]
    return " ".join(words)

# Prepare dataset
dataset_sentences = [preprocess(sentence) for sentence, emotion in data]
dataset_labels = [emotion for sentence, emotion in data]

# TF-IDF on dataset
vectorizer = TfidfVectorizer()
X_train = vectorizer.fit_transform(dataset_sentences)

# Train model
model = MultinomialNB()
model.fit(X_train, dataset_labels)

# Predict for user input
X_input = vectorizer.transform([final_sentence])
prediction = model.predict(X_input)

print("Predicted emotion:", prediction[0])