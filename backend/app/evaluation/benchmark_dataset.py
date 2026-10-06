from typing import List, Dict, Any

BENCHMARK_DATASET: List[Dict[str, Any]] = [
    {
        "id": "bench-01",
        "query": "What is the fundamental prerequisite condition for binary search to work?",
        "expected_type": "grounded",
        "expected_keywords": ["sorted", "monotonic", "ascending", "descending"],
        "expected_source": "Algorithms_Textbook.pdf — Page 42",
        "description": "Standard in-domain prerequisite query on Binary Search."
    },
    {
        "id": "bench-02",
        "query": "Explain the time complexity of binary search and why it is logarithmic.",
        "expected_type": "grounded",
        "expected_keywords": ["log", "divide", "half", "o(log n)"],
        "expected_source": "Lecture_03_Searching.mp4 — Timestamp 14:22",
        "description": "Complexity inquiry verifying source grounding on video lecture material."
    },
    {
        "id": "bench-03",
        "query": "What is the theoretical lower bound for comparison-based sorting algorithms?",
        "expected_type": "grounded",
        "expected_keywords": ["omega(n log n)", "decision tree", "n!"],
        "expected_source": "Algorithms_Textbook.pdf — Page 112",
        "description": "Theoretical algorithmic bound from textbook materials."
    },
    {
        "id": "bench-04",
        "query": "How does BFS find the shortest path in an unweighted graph?",
        "expected_type": "grounded",
        "expected_keywords": ["queue", "level", "shortest", "unweighted", "breadth"],
        "expected_source": "Algorithms_Textbook.pdf — Page 160",
        "description": "Graph algorithm search mechanics query."
    },
    {
        "id": "bench-05",
        "query": "What is the recipe for baking chocolate chip cookies?",
        "expected_type": "refusal",
        "expected_keywords": ["couldn't find", "course material", "integrity"],
        "expected_source": None,
        "description": "Out-of-domain query testing graceful source-grounding refusal."
    },
    {
        "id": "bench-06",
        "query": "Who was the first emperor of the Roman Empire?",
        "expected_type": "refusal",
        "expected_keywords": ["couldn't find", "course material"],
        "expected_source": None,
        "description": "Out-of-domain history question testing refusal integrity."
    },
    {
        "id": "bench-07",
        "query": "How do you synthesize quantum qubits using superconducting circuits?",
        "expected_type": "refusal",
        "expected_keywords": ["couldn't find", "course material"],
        "expected_source": None,
        "description": "Out-of-domain advanced physics query testing non-hallucination."
    }
]
