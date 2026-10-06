from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.db_models import Misconception, Question

class MisconceptionAnalysisAgent:
    """
    AGENT 6: MISCONCEPTION ANALYSIS AGENT
    Diagnoses student incorrect answers, identifies the underlying conceptual flaw,
    and returns targeted remediation feedback.
    """
    def __init__(self, db: Session):
        self.db = db

    def analyze_attempt(
        self,
        user_id: str,
        course_id: str,
        question: Question,
        student_answer: str
    ) -> Tuple[str, str, str]:
        """
        Returns: (misconception_name, misconception_topic, targeted_feedback)
        """
        student_ans_lower = student_answer.strip().lower()
        topic = question.topic
        concept = question.concept or topic

        misconception_name = "General Knowledge Gap"
        feedback = f"Your answer '{student_answer}' is incorrect. The expected answer is '{question.correct_answer}'. Review the explanation: {question.explanation}"

        # 1. Binary Search Misconceptions
        if "binary search" in topic.lower() or "searching" in topic.lower():
            if "positive" in student_ans_lower or "unique" in student_ans_lower or "power of two" in student_ans_lower:
                misconception_name = "Misunderstanding of Binary Search Preconditions"
                feedback = (
                    "**Misconception Diagnosed:** You believed Binary Search requires unique elements, positive numbers, or power-of-two lengths. "
                    "**Correction:** Binary search ONLY requires the collection to be **monotonically sorted** (ascending or descending). "
                    "The elements can be negative, repeated, or any array length. Refer to [Algorithms_Textbook.pdf — Page 42]."
                )
            elif "o(n)" in student_ans_lower or "o(1)" in student_ans_lower or "o(n log n)" in student_ans_lower:
                misconception_name = "Confusing Linear Scan with Logarithmic Halving"
                feedback = (
                    "**Misconception Diagnosed:** You chose a linear O(n) or constant complexity. "
                    "**Correction:** Because half the elements are discarded at every iteration step, the recurrence is T(n) = T(n/2) + O(1), "
                    "which evaluates to logarithmic time **O(log n)**."
                )
            elif "low + high" in student_ans_lower:
                misconception_name = "Integer Overflow Blindspot"
                feedback = (
                    "**Misconception Diagnosed:** `(low + high) / 2` fails in 32-bit fixed integer architectures when their sum exceeds 2,147,483,647. "
                    "**Correction:** Use `low + (high - low) / 2` to safely compute middle index without overflow."
                )

        # 2. Recursion Misconceptions
        elif "recursion" in topic.lower():
            if "o(1)" in student_ans_lower or "none" in student_ans_lower:
                misconception_name = "Ignoring Call Stack Growth"
                feedback = (
                    "**Misconception Diagnosed:** Recursive calls are not instantaneous or zero-cost. "
                    "**Correction:** Without a stopping base case, each call consumes a new stack frame until the memory ceiling is breached, causing a `StackOverflow`."
                )
            elif "o(n)" in student_ans_lower or "o(n log n)" in student_ans_lower:
                misconception_name = "Underestimating Exponential Tree Branching"
                feedback = (
                    "**Misconception Diagnosed:** Naive Fibonacci branches into two subproblems at every level, creating a full binary tree of height n. "
                    "**Correction:** The number of nodes is 2^0 + 2^1 + ... + 2^n = O(2^n). Use dynamic programming / memoization to reduce it to O(n)."
                )

        # 3. Sorting Misconceptions
        elif "sort" in topic.lower():
            if "omega(n)" in student_ans_lower or "omega(log n)" in student_ans_lower:
                misconception_name = "Comparison Sort Theoretical Bound Misconception"
                feedback = (
                    "**Misconception Diagnosed:** In comparison models, distinguishing between n! permutations requires a decision tree of minimum depth log2(n!) = **Omega(n log n)**. "
                    "Linear time sorting is only achievable in non-comparison algorithms like Counting/Radix sort."
                )
            elif "quick sort" in student_ans_lower:
                misconception_name = "Assuming Quick Sort Worst-Case is O(n log n)"
                feedback = (
                    "**Misconception Diagnosed:** Quick Sort average case is O(n log n), but with poor pivot selection on already sorted arrays, it degrades to O(n^2). "
                    "**Merge Sort** is the algorithm that guarantees O(n log n) in all worst-case scenarios."
                )

        # 4. Graph & Tree Misconceptions
        elif "graph" in topic.lower() or "tree" in topic.lower():
            if "dfs" in student_ans_lower or "depth" in student_ans_lower:
                misconception_name = "Using DFS for Unweighted Shortest Path"
                feedback = (
                    "**Misconception Diagnosed:** DFS wanders deeply along a single path and can discover a deeply indirect path before a direct 1-hop path. "
                    "**Correction:** **BFS (Breadth-First Search)** explores vertices in increasing order of distance, guaranteeing the shortest path in unweighted graphs."
                )

        # Record or update in Misconceptions table
        existing_misc = self.db.query(Misconception).filter(
            Misconception.user_id == user_id,
            Misconception.course_id == course_id,
            Misconception.misconception_name == misconception_name
        ).first()

        if existing_misc:
            existing_misc.count += 1
            existing_misc.resolved = False
        else:
            new_misc = Misconception(
                user_id=user_id,
                course_id=course_id,
                topic=topic,
                concept=concept,
                misconception_name=misconception_name,
                description=feedback,
                count=1,
                resolved=False
            )
            self.db.add(new_misc)

        self.db.commit()
        return misconception_name, topic, feedback
