import re
import math
from typing import List, Dict
from collections import Counter
from app.core.config import settings

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't",
    "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers",
    "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
    "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
    "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their",
    "theirs", "them", "themselves", "then", "there", "there's", "these", "they",
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
    "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're",
    "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's",
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself",
    "yourselves", "explain", "describe", "tell"
}

class EmbeddingService:
    @staticmethod
    def tokenize(text: str) -> List[str]:
        text = text.lower()
        words = re.findall(r"\b[a-zA-Z0-9_]+\b", text)
        return [w for w in words if w not in STOPWORDS and len(w) > 2]

    @classmethod
    def get_embedding_vector(cls, text: str, vocab: Dict[str, int] = None) -> List[float]:
        """
        Creates a normalized TF-IDF vector or calls remote embedding API if configured.
        """
        if settings.EMBEDDING_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                import httpx
                response = httpx.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    json={"model": settings.EMBEDDING_MODEL, "input": text},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()["data"][0]["embedding"]
            except Exception:
                pass

        if settings.EMBEDDING_PROVIDER == "ollama":
            try:
                import httpx
                response = httpx.post(
                    f"{settings.OLLAMA_BASE_URL}/api/embeddings",
                    json={"model": settings.EMBEDDING_MODEL, "prompt": text},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()["embedding"]
            except Exception:
                pass

        # Robust built-in token-frequency hashing vectorizer (384 dimensions)
        dim = 384
        vector = [0.0] * dim
        tokens = cls.tokenize(text)
        if not tokens:
            return vector
            
        counts = Counter(tokens)
        for token, count in counts.items():
            # Hash token to fixed dimension bucket
            idx = abs(hash(token)) % dim
            # Frequency with sublinear term scaling
            vector[idx] += 1.0 + math.log(count)

        # L2 Normalize
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]
            
        return vector

    @classmethod
    def compute_similarity(cls, vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        return sum(a * b for a, b in zip(vec1, vec2))
