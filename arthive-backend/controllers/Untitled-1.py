# ============================================================
#   SPAM EMAIL DETECTOR — Built from SCRATCH
#   Zero external libraries. Pure Python only.
#
#   What we build manually:
#   - Text cleaning
#   - TF-IDF vectorization
#   - Naive Bayes classifier
#   - Train/test split
#   - Accuracy & evaluation metrics
# ============================================================

import re
import math
import random

# ═══════════════════════════════════════════════════════════
#  STEP 1 — DATASET
# ═══════════════════════════════════════════════════════════

dataset = [
    # (label, email_text)   label: 1=spam, 0=ham
    (1, "Congratulations! You've won a $1,000 gift card. Click here to claim now!"),
    (1, "FREE entry to win FA Cup Final tickets! Text FA to 87121 now!"),
    (1, "You have been selected for a cash prize of $500. Reply YES to claim."),
    (1, "URGENT: Your account has been suspended. Verify now at fake-bank.com"),
    (1, "Earn $5000 a week working from home! No experience needed. Click here."),
    (1, "Get cheap meds online! No prescription needed. Buy now!"),
    (1, "You are a WINNER! Call FREE now to claim your holiday package!"),
    (1, "Lose 30 pounds in 30 days with this one weird trick. Buy now!"),
    (1, "Investment opportunity with 200 percent returns guaranteed. Act fast!"),
    (1, "Your PayPal account has been limited. Click to restore access immediately."),
    (1, "Hot singles in your area want to meet you tonight!"),
    (1, "Claim your free iPhone. Limited offer expires today. Visit site now."),
    (1, "TAX REFUND: You are owed money. Submit your bank details to receive funds."),
    (1, "Six chances to win CASH! Text WIN to 80086. Free entry, terms apply."),
    (1, "Double your Bitcoin in 24 hours. Guaranteed returns! Join now."),
    (1, "You qualify for a government grant of $8000. Claim before deadline!"),
    (1, "Special discount 80 percent OFF! Today only. Buy now before it expires!"),
    (1, "Click here to unsubscribe or you will be charged monthly fees."),
    (1, "Win a brand new car! Enter our free prize draw. SMS CAR to 12345."),
    (1, "Verify your identity NOW or your account will be permanently deleted."),
    (1, "Exclusive VIP offer! Only for selected members. Claim your reward now!"),
    (1, "You have a pending payment of $2000. Confirm your details to receive it."),
    (1, "FREE GIFT waiting for you! Click the link to collect your prize today."),
    (1, "Your loan has been pre-approved! Get $10000 instantly. No credit check."),
    (1, "Alert: Suspicious login detected. Click here to secure your account now."),
    (0, "Hey, are we still meeting for lunch tomorrow at noon?"),
    (0, "I'll be home late tonight. Can you start dinner without me?"),
    (0, "Your Amazon order has been shipped. Expected delivery is Friday."),
    (0, "Just checking in, how are you feeling after the interview?"),
    (0, "Reminder: Your dentist appointment is on Thursday at 3 PM."),
    (0, "Thanks for sending the report. I will review it and get back to you."),
    (0, "Can you pick up some milk on your way home?"),
    (0, "The project deadline has been moved to next Monday. Please update your plan."),
    (0, "Great work on the presentation today! The client was really impressed."),
    (0, "Your pull request has been approved and merged successfully."),
    (0, "Mom wants to know if you are coming for dinner on Sunday."),
    (0, "Meeting rescheduled to 2 PM. Same room and same agenda as before."),
    (0, "I have attached the invoice for this month. Let me know if you need anything."),
    (0, "Don't forget, team standup is at 9 AM tomorrow morning."),
    (0, "Your flight is confirmed. Check-in opens 24 hours before departure."),
    (0, "Can you send me the notes from yesterday's lecture please?"),
    (0, "The internet is down at home today. I am working from a cafe."),
    (0, "Happy birthday! Hope you have a wonderful day today."),
    (0, "I got the job! Starting next Monday. So excited about this opportunity."),
    (0, "Your library book is due back on Saturday. Renew online if needed."),
    (0, "Please review the attached contract before our meeting tomorrow."),
    (0, "The server maintenance is scheduled for Sunday night after midnight."),
    (0, "Just wanted to say thank you for all your help this week."),
    (0, "Lunch is on me today. Meet at the usual spot at 1 PM."),
    (0, "Your subscription renewal is coming up next month. No action needed."),
]


# ═══════════════════════════════════════════════════════════
#  STEP 2 — TEXT CLEANING  (built from scratch)
# ═══════════════════════════════════════════════════════════

STOP_WORDS = {
    'a','an','the','and','or','but','in','on','at','to','for',
    'of','with','by','from','is','it','its','as','are','was',
    'be','been','this','that','these','those','i','you','he',
    'she','we','they','my','your','his','her','our','their',
    'me','him','us','them','so','if','do','not','no','up',
    'out','all','just','have','has','had','will','would','can',
    'could','should','may','about','after','before','into','than',
    'more','also','only','very','then','there','when','how','what',
    'which','who','any','some','each','over','here','get','got',
    'please','know','back','need','make','time','day','today',
    'tomorrow','next','last','new','one','two','three','same',
    'way','now','still','let','see','like','well','want','going',
    'come','take','give','keep','tell','say'
}

def clean_text(text):
    """Lowercase, remove punctuation, remove stop words, tokenize."""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', ' url ', text)   # mark URLs
    text = re.sub(r'\d+', ' num ', text)               # mark numbers
    text = re.sub(r'[^a-z\s]', ' ', text)             # remove symbols
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOP_WORDS and len(t) > 1]
    return tokens


# ═══════════════════════════════════════════════════════════
#  STEP 3 — TF-IDF  (built from scratch)
# ═══════════════════════════════════════════════════════════

def compute_tf(tokens):
    """Term Frequency: how often each word appears in this document."""
    tf = {}
    for word in tokens:
        tf[word] = tf.get(word, 0) + 1
    total = len(tokens) if tokens else 1
    for word in tf:
        tf[word] /= total
    return tf

def compute_idf(all_token_lists):
    """Inverse Document Frequency: rare words across all docs get higher score."""
    doc_count = len(all_token_lists)
    idf = {}
    # collect all unique words
    all_words = set(w for tokens in all_token_lists for w in tokens)
    for word in all_words:
        docs_with_word = sum(1 for tokens in all_token_lists if word in tokens)
        idf[word] = math.log((doc_count + 1) / (docs_with_word + 1)) + 1
    return idf

def compute_tfidf_vector(tokens, idf, vocabulary):
    """Combine TF and IDF into a fixed-length vector."""
    tf = compute_tf(tokens)
    vector = []
    for word in vocabulary:
        tfidf_score = tf.get(word, 0) * idf.get(word, 0)
        vector.append(tfidf_score)
    # Normalize the vector (L2 norm)
    magnitude = math.sqrt(sum(v * v for v in vector)) or 1
    return [v / magnitude for v in vector]


# ═══════════════════════════════════════════════════════════
#  STEP 4 — NAIVE BAYES CLASSIFIER  (built from scratch)
# ═══════════════════════════════════════════════════════════
#
#  Formula: P(spam | words) ∝ P(spam) × ∏ P(word | spam)
#  We use log probabilities to avoid underflow with tiny numbers.

class NaiveBayesClassifier:
    def __init__(self, alpha=1.0):
        self.alpha = alpha          # Laplace smoothing factor
        self.class_log_prior = {}   # log P(class)
        self.word_log_prob = {}     # log P(word | class)
        self.vocabulary = set()

    def train(self, token_lists, labels):
        """Train the classifier on tokenized documents."""
        classes = set(labels)
        total_docs = len(labels)

        for cls in classes:
            # All tokens belonging to this class
            class_tokens = []
            class_doc_count = 0
            for tokens, label in zip(token_lists, labels):
                if label == cls:
                    class_tokens.extend(tokens)
                    class_doc_count += 1
                self.vocabulary.update(tokens)

            # log P(class) = log(count of class / total docs)
            self.class_log_prior[cls] = math.log(class_doc_count / total_docs)

            # Count word frequencies in this class
            word_counts = {}
            for word in class_tokens:
                word_counts[word] = word_counts.get(word, 0) + 1

            vocab_size = len(self.vocabulary)
            total_words = sum(word_counts.values())

            # log P(word | class) with Laplace smoothing
            self.word_log_prob[cls] = {}
            for word in self.vocabulary:
                count = word_counts.get(word, 0)
                self.word_log_prob[cls][word] = math.log(
                    (count + self.alpha) / (total_words + self.alpha * vocab_size)
                )

    def predict(self, tokens):
        """Return predicted class and confidence scores."""
        scores = {}
        for cls in self.class_log_prior:
            score = self.class_log_prior[cls]
            for word in tokens:
                if word in self.word_log_prob[cls]:
                    score += self.word_log_prob[cls][word]
                # unknown words are simply ignored (safe for our use case)
            scores[cls] = score

        # Convert log scores to probabilities via softmax
        max_score = max(scores.values())
        exp_scores = {cls: math.exp(s - max_score) for cls, s in scores.items()}
        total = sum(exp_scores.values())
        probabilities = {cls: v / total for cls, v in exp_scores.items()}

        predicted_class = max(probabilities, key=probabilities.get)
        return predicted_class, probabilities


# ═══════════════════════════════════════════════════════════
#  STEP 5 — TRAIN / TEST SPLIT  (built from scratch)
# ═══════════════════════════════════════════════════════════

def train_test_split(data, test_ratio=0.20, seed=42):
    """Shuffle and split data into training and test sets."""
    random.seed(seed)
    data_copy = data[:]
    random.shuffle(data_copy)
    split_idx = int(len(data_copy) * (1 - test_ratio))
    return data_copy[:split_idx], data_copy[split_idx:]

def evaluate(predictions, true_labels):
    """Calculate accuracy, precision, recall, F1 from scratch."""
    tp = sum(1 for p, t in zip(predictions, true_labels) if p == 1 and t == 1)
    tn = sum(1 for p, t in zip(predictions, true_labels) if p == 0 and t == 0)
    fp = sum(1 for p, t in zip(predictions, true_labels) if p == 1 and t == 0)
    fn = sum(1 for p, t in zip(predictions, true_labels) if p == 0 and t == 1)

    accuracy  = (tp + tn) / len(predictions) if predictions else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall    = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1        = (2 * precision * recall / (precision + recall)
                 if (precision + recall) > 0 else 0)

    return {
        'accuracy': accuracy, 'precision': precision,
        'recall': recall, 'f1': f1,
        'tp': tp, 'tn': tn, 'fp': fp, 'fn': fn
    }


# ═══════════════════════════════════════════════════════════
#  STEP 6 — TRAIN THE MODEL
# ═══════════════════════════════════════════════════════════

print("=" * 60)
print("   SPAM DETECTOR — Pure Python, Zero External Libraries")
print("=" * 60)

# Split dataset
train_data, test_data = train_test_split(dataset, test_ratio=0.20)
print(f"\nDataset  : {len(dataset)} emails total")
print(f"Training : {len(train_data)} emails")
print(f"Testing  : {len(test_data)} emails\n")

# Tokenize
train_labels  = [label for label, _ in train_data]
train_tokens  = [clean_text(text) for _, text in train_data]

test_labels   = [label for label, _ in test_data]
test_texts    = [text for _, text in test_data]
test_tokens   = [clean_text(text) for text in test_texts]

# Train Naive Bayes
nb = NaiveBayesClassifier(alpha=1.0)
nb.train(train_tokens, train_labels)
print(f"Vocabulary size: {len(nb.vocabulary)} unique words\n")

# Predict on test set
predictions = []
for tokens in test_tokens:
    pred, _ = nb.predict(tokens)
    predictions.append(pred)

# Evaluate
metrics = evaluate(predictions, test_labels)

print("=" * 60)
print("  EVALUATION RESULTS")
print("=" * 60)
print(f"\n  Accuracy  : {metrics['accuracy']*100:.1f}%")
print(f"  Precision : {metrics['precision']*100:.1f}%  (of emails flagged spam, how many really were)")
print(f"  Recall    : {metrics['recall']*100:.1f}%  (of real spam, how many did we catch)")
print(f"  F1 Score  : {metrics['f1']*100:.1f}%  (balance of precision & recall)")
print(f"\n  Confusion Matrix:")
print(f"              Predicted Ham   Predicted Spam")
print(f"  Actual Ham      {metrics['tn']:^5}              {metrics['fp']:^5}")
print(f"  Actual Spam     {metrics['fn']:^5}              {metrics['tp']:^5}")


# ═══════════════════════════════════════════════════════════
#  STEP 7 — TEST WITH SAMPLE EMAILS
# ═══════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("  SAMPLE EMAIL PREDICTIONS")
print("=" * 60)

samples = [
    (1, "You have won a free vacation! Click to claim your prize now."),
    (0, "Hi, are you free for a call this afternoon?"),
    (1, "Exclusive deal: 80 percent off today only! Buy now before it expires!"),
    (0, "Your order has been delivered. Thank you for shopping with us."),
    (1, "URGENT: Verify your bank account or face permanent suspension."),
    (0, "Can you review the document before tomorrow's meeting?"),
    (1, "Congratulations! You are our lucky winner. Claim your $5000 reward."),
    (0, "Mom called, she wants to know if you are coming for dinner Sunday."),
]

correct = 0
for true_label, email in samples:
    tokens = clean_text(email)
    pred, proba = nb.predict(tokens)
    confidence = proba[pred] * 100
    result_str = "SPAM" if pred == 1 else "NOT SPAM"
    true_str   = "SPAM" if true_label == 1 else "NOT SPAM"
    match      = "CORRECT" if pred == true_label else "WRONG  "
    if pred == true_label:
        correct += 1
    print(f"\n  [{match}] Result: {result_str:10s} ({confidence:.0f}% confidence)")
    print(f"           Email: {email[:65]}")

print(f"\n  Sample accuracy: {correct}/{len(samples)} correct\n")


# ═══════════════════════════════════════════════════════════
#  STEP 8 — INTERACTIVE MODE
# ═══════════════════════════════════════════════════════════

print("=" * 60)
print("  INTERACTIVE MODE — Type any email text to classify it")
print("  Type 'quit' to exit")
print("=" * 60)

while True:
    print()
    user_input = input("Enter email text: ").strip()
    if user_input.lower() in ('quit', 'exit', 'q'):
        print("\nGoodbye!\n")
        break
    if not user_input:
        continue
    tokens = clean_text(user_input)
    pred, proba = nb.predict(tokens)
    result = "SPAM" if pred == 1 else "NOT SPAM (Ham)"
    spam_conf = proba[1] * 100
    ham_conf  = proba[0] * 100
    print(f"  Result    : {result}")
    print(f"  Spam prob : {spam_conf:.1f}%")
    print(f"  Ham prob  : {ham_conf:.1f}%")
    if tokens:
        print(f"  Key words : {', '.join(tokens[:8])}")
    else:
        print("  (no meaningful words found after cleaning)")