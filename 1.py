from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB

# Step 1: Training data
texts = ["I am happy", "I am sad", "I am excited", "I am angry"]
labels = ["happy 😊", "sad 😔", "happy 😁", "angry 😡"]

# Step 2: Convert text → numbers
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

# Step 3: Train model
model = MultinomialNB()
model.fit(X, labels)

# Step 4: Test
test = vectorizer.transform(["I feel sad and happy at the same time"])
print(model.predict(test))