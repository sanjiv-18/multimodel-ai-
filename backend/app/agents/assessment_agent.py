import json
import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Assessment, Question, DocumentChunk, LearnerMastery
from app.agents.verification_agent import QuestionVerificationAgent

class AssessmentGenerationAgent:
    """
    AGENT 4: ASSESSMENT GENERATION AGENT
    Generates tailored assessments (MCQ, short-answer, problem solving) based on topic,
    learner mastery level, and course materials.
    Coupled with Agent 5 verification pipeline.
    """
    def __init__(self, db: Session):
        self.db = db

    def generate_assessment(
        self,
        course_id: str,
        user_id: str,
        topic: str,
        difficulty: str = "Medium",
        num_questions: int = 4,
        adaptive_mode: bool = True
    ) -> Assessment:
        # Determine target difficulty based on learner mastery if adaptive
        if adaptive_mode or difficulty == "Adaptive":
            mastery_record = self.db.query(LearnerMastery).filter(
                LearnerMastery.user_id == user_id,
                LearnerMastery.course_id == course_id,
                LearnerMastery.topic.ilike(f"%{topic}%")
            ).first()
            current_mastery = mastery_record.mastery_score if mastery_record else 0.5
            
            if current_mastery < 0.4:
                difficulty = "Easy"
            elif current_mastery < 0.75:
                difficulty = "Medium"
            else:
                difficulty = "Hard"

        # Create Assessment record
        assessment = Assessment(
            course_id=course_id,
            user_id=user_id,
            topic=topic,
            difficulty=difficulty,
            total_questions=num_questions
        )
        self.db.add(assessment)
        self.db.flush()

        # Generate verified questions for topic
        # 1. First attempt dynamic question generation from actual course chunks
        candidate_pool = self._generate_from_course_chunks(course_id, topic, difficulty)
        
        # 2. If dynamic generation produces fewer than needed, blend with curated bank
        if len(candidate_pool) < num_questions:
            bank_items = self._get_question_bank(topic, difficulty)
            candidate_pool.extend(bank_items)

        selected_questions = []

        for item in candidate_pool:
            if len(selected_questions) >= num_questions:
                break
                
            # AGENT 5: Run Verification Loop
            passed, v_notes = QuestionVerificationAgent.verify_question(item)
            if not passed:
                # Reject and continue to next item in regeneration workflow
                continue

            q = Question(
                assessment_id=assessment.id,
                question_text=item["question_text"],
                question_type=item.get("question_type", "mcq"),
                options_json=json.dumps(item.get("options", [])),
                correct_answer=item["correct_answer"],
                explanation=item["explanation"],
                topic=topic,
                concept=item.get("concept", topic),
                difficulty=difficulty,
                source_reference=item.get("source_reference", "Course Learning Material"),
                is_verified=True,
                verification_notes=v_notes
            )
            self.db.add(q)
            selected_questions.append(q)

        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    def _generate_from_course_chunks(self, course_id: str, topic: str, difficulty: str) -> List[Dict[str, Any]]:
        chunks = self.db.query(DocumentChunk).filter(
            DocumentChunk.course_id == course_id,
            DocumentChunk.topic.ilike(f"%{topic}%")
        ).limit(6).all()

        if not chunks:
            # Fallback to any chunks in the course
            chunks = self.db.query(DocumentChunk).filter(
                DocumentChunk.course_id == course_id
            ).limit(4).all()

        questions = []
        for ch in chunks:
            loc = ""
            if ch.material_type == "pdf" and ch.page_number:
                loc = f"Page {ch.page_number}"
            elif ch.material_type == "pptx" and ch.slide_number:
                loc = f"Slide {ch.slide_number}"
            elif ch.material_type == "video" and ch.video_timestamp:
                loc = f"Timestamp {ch.video_timestamp}"
            src_ref = f"{ch.source_name} — {loc}" if loc else ch.source_name

            # Extract key statements from chunk content
            sentences = [s.strip() for s in ch.content.split(".") if len(s.strip()) > 25]
            if not sentences:
                continue

            lead_fact = sentences[0]
            concept_name = ch.concept or ch.topic or topic

            q_item = {
                "question_text": f"Based on {ch.source_name}, which statement accurately reflects the principles of {concept_name}?",
                "question_type": "mcq",
                "options": [
                    lead_fact,
                    f"{concept_name} operates with arbitrary unconstrained parameters.",
                    f"{concept_name} requires no formal terminating or boundary conditions.",
                    f"Execution of {concept_name} completely bypasses memory state constraints."
                ],
                "correct_answer": lead_fact,
                "explanation": f"As documented in {src_ref}: '{lead_fact}'.",
                "concept": concept_name,
                "source_reference": src_ref
            }
            questions.append(q_item)

        return questions


    def _get_question_bank(self, topic: str, difficulty: str) -> List[Dict[str, Any]]:
        lower_t = topic.lower()
        
        # Searching / Binary Search
        if "search" in lower_t:
            return [
                {
                    "question_text": "What is the fundamental prerequisite condition for Binary Search to execute correctly?",
                    "question_type": "mcq",
                    "options": [
                        "The input array must be sorted in ascending or descending order.",
                        "The input array must contain strictly positive integers.",
                        "The input array elements must all be unique.",
                        "The array length must be an exact power of two."
                    ],
                    "correct_answer": "The input array must be sorted in ascending or descending order.",
                    "explanation": "Binary search relies on divide-and-conquer logic by comparing against the middle element. This property requires the input collection to be sorted.",
                    "concept": "Binary Search",
                    "source_reference": "Algorithms_Textbook.pdf — Page 42"
                },
                {
                    "question_text": "What is the worst-case time complexity of Binary Search on a sorted array with n elements?",
                    "question_type": "mcq",
                    "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                    "correct_answer": "O(log n)",
                    "explanation": "At each comparison step, Binary Search eliminates half of the remaining search window, yielding a recurrence of T(n) = T(n/2) + O(1), which solves to O(log n).",
                    "concept": "Binary Search Complexity",
                    "source_reference": "Lecture_03_Searching.mp4 — Timestamp 14:22"
                },
                {
                    "question_text": "In binary search, how should you compute the middle index to prevent potential integer overflow in languages with fixed-width integers?",
                    "question_type": "mcq",
                    "options": [
                        "mid = (low + high) / 2",
                        "mid = low + (high - low) / 2",
                        "mid = (high - low) / 2",
                        "mid = low + high"
                    ],
                    "correct_answer": "mid = low + (high - low) / 2",
                    "explanation": "Computing low + (high - low) / 2 is mathematically identical to (low + high) / 2 but avoids overflow when (low + high) exceeds 32-bit integer MAX_INT.",
                    "concept": "Binary Search Implementation",
                    "source_reference": "LectureSlides_Algorithms.pptx — Slide 27"
                },
                {
                    "question_text": "If an array has 1,024 sorted elements, what is the maximum number of comparisons Binary Search needs in the worst case?",
                    "question_type": "mcq",
                    "options": ["10", "11", "512", "1024"],
                    "correct_answer": "11",
                    "explanation": "log2(1024) = 10; including the final boundary check, at most 11 comparisons are performed before terminating.",
                    "concept": "Logarithmic Bounds",
                    "source_reference": "Algorithms_Textbook.pdf — Page 45"
                }
            ]
            
        # Recursion
        elif "recursion" in lower_t or "base" in lower_t:
            return [
                {
                    "question_text": "What happens if a recursive function does not define or reach a valid base case?",
                    "question_type": "mcq",
                    "options": [
                        "The program raises a StackOverflow error due to infinite call recursion.",
                        "The compiler automatically adds a return 0 statement.",
                        "The function executes in O(1) time.",
                        "The program silently returns None immediately."
                    ],
                    "correct_answer": "The program raises a StackOverflow error due to infinite call recursion.",
                    "explanation": "Every recursive call allocates a stack frame in the program memory. Without a base case, calls proceed indefinitely until the call stack limit is exhausted.",
                    "concept": "Recursion Base Cases",
                    "source_reference": "Algorithms_Textbook.pdf — Page 78"
                },
                {
                    "question_text": "In the standard recursive implementation of the Fibonacci sequence: fib(n) = fib(n-1) + fib(n-2), what is the naive time complexity without memoization?",
                    "question_type": "mcq",
                    "options": ["O(n)", "O(n log n)", "O(2^n)", "O(1)"],
                    "correct_answer": "O(2^n)",
                    "explanation": "The recursion tree branches exponentially into two sub-calls at each level, causing redundant subproblem computations with O(2^n) complexity.",
                    "concept": "Tree Recursion & Complexity",
                    "source_reference": "Lecture_04_Recursion.mp4 — Timestamp 21:05"
                },
                {
                    "question_text": "Which data structure is implicitly maintained by the runtime system during recursive function execution?",
                    "question_type": "mcq",
                    "options": ["Call Stack", "FIFO Queue", "Hash Table", "Binary Heap"],
                    "correct_answer": "Call Stack",
                    "explanation": "The operating environment utilizes a LIFO Call Stack frame to preserve local variables, program counter, and return addresses for each nested invocation.",
                    "concept": "Call Stack Execution",
                    "source_reference": "LectureSlides_Algorithms.pptx — Slide 44"
                },
                {
                    "question_text": "What is 'Tail Recursion' and why is it beneficial in optimized compilers?",
                    "question_type": "mcq",
                    "options": [
                        "The recursive call is the very last operation, enabling compiler stack-frame reuse.",
                        "The recursion executes backwards from the end of an array.",
                        "The function has multiple return statements in the header.",
                        "The base case is placed at the end of the file."
                    ],
                    "correct_answer": "The recursive call is the very last operation, enabling compiler stack-frame reuse.",
                    "explanation": "Tail Call Optimization (TCO) allows compilers to convert the recursive invocation into a loop jump, achieving O(1) auxiliary space.",
                    "concept": "Tail Call Optimization",
                    "source_reference": "Algorithms_Textbook.pdf — Page 85"
                }
            ]

        # Sorting
        elif "sort" in lower_t:
            return [
                {
                    "question_text": "What is the theoretical lower bound for the comparison-based sorting problem on n items in the worst case?",
                    "question_type": "mcq",
                    "options": ["Omega(n)", "Omega(n log n)", "Omega(n^2)", "Omega(log n)"],
                    "correct_answer": "Omega(n log n)",
                    "explanation": "Based on the decision tree model, any comparison-based sort has at least n! leaves, leading to a minimum depth of log2(n!) = Omega(n log n).",
                    "concept": "Comparison Sort Lower Bound",
                    "source_reference": "Algorithms_Textbook.pdf — Page 112"
                },
                {
                    "question_text": "Which of the following sorting algorithms guarantees O(n log n) time in the worst case and is stable?",
                    "question_type": "mcq",
                    "options": ["Merge Sort", "Quick Sort", "Heap Sort", "Selection Sort"],
                    "correct_answer": "Merge Sort",
                    "explanation": "Merge sort consistently divides arrays into halves and merges in linear time, guaranteeing O(n log n) worst-case time with stability.",
                    "concept": "Merge Sort",
                    "source_reference": "LectureSlides_Algorithms.pptx — Slide 58"
                },
                {
                    "question_text": "What is the worst-case time complexity of standard Quick Sort when a bad pivot (e.g. smallest/largest) is chosen repeatedly?",
                    "question_type": "mcq",
                    "options": ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
                    "correct_answer": "O(n^2)",
                    "explanation": "When unbalanced partitions occur of size 1 and n-1 at each step, the recursion depth is n, yielding O(n^2) total comparisons.",
                    "concept": "Quick Sort Partitioning",
                    "source_reference": "Lecture_03_Searching.mp4 — Timestamp 31:40"
                },
                {
                    "question_text": "What does it mean for a sorting algorithm to be 'in-place'?",
                    "question_type": "mcq",
                    "options": [
                        "It requires only O(1) or O(log n) additional auxiliary memory beyond the input array.",
                        "It runs in O(1) time.",
                        "It cannot sort negative numbers.",
                        "It requires a secondary auxiliary array of size n."
                    ],
                    "correct_answer": "It requires only O(1) or O(log n) additional auxiliary memory beyond the input array.",
                    "explanation": "In-place algorithms modify the input structure directly without requiring O(n) auxiliary allocation.",
                    "concept": "Space Complexity & In-Place",
                    "source_reference": "Algorithms_Textbook.pdf — Page 115"
                }
            ]

        # Graphs / Trees
        else:
            return [
                {
                    "question_text": "Which traversal algorithm is well-suited for finding the shortest path in an unweighted graph?",
                    "question_type": "mcq",
                    "options": ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Inorder Traversal", "Topological Sort"],
                    "correct_answer": "Breadth-First Search (BFS)",
                    "explanation": "BFS explores graph vertices level by level, ensuring the first time a vertex is reached corresponds to the minimum number of edge hops.",
                    "concept": "Breadth-First Search",
                    "source_reference": "Algorithms_Textbook.pdf — Page 160"
                },
                {
                    "question_text": "In a Binary Search Tree (BST), what traversal order outputs the elements in strictly sorted ascending order?",
                    "question_type": "mcq",
                    "options": ["Inorder (Left, Root, Right)", "Preorder (Root, Left, Right)", "Postorder (Left, Right, Root)", "Level-order"],
                    "correct_answer": "Inorder (Left, Root, Right)",
                    "explanation": "Because BST invariant mandates Left < Root < Right, an Inorder traversal visits smaller elements before parent and parent before larger elements.",
                    "concept": "BST Invariant",
                    "source_reference": "LectureSlides_Algorithms.pptx — Slide 72"
                },
                {
                    "question_text": "What is the time complexity of Depth-First Search on a graph with V vertices and E edges represented using an Adjacency List?",
                    "question_type": "mcq",
                    "options": ["O(V + E)", "O(V * E)", "O(V^2)", "O(log V)"],
                    "correct_answer": "O(V + E)",
                    "explanation": "Every vertex is visited once and each adjacent edge is examined once, yielding O(V + E) linear graph traversal complexity.",
                    "concept": "Graph Traversal Complexity",
                    "source_reference": "Algorithms_Textbook.pdf — Page 172"
                },
                {
                    "question_text": "Which data structure is primarily used to implement Dijkstra's Shortest Path algorithm efficiently?",
                    "question_type": "mcq",
                    "options": ["Min-Priority Queue (Min-Heap)", "FIFO Queue", "Stack", "Disjoint Set (Union-Find)"],
                    "correct_answer": "Min-Priority Queue (Min-Heap)",
                    "explanation": "A Min-Heap allows extracting the vertex with minimum tentative distance in O(log V) time, giving O((V + E) log V) total complexity.",
                    "concept": "Dijkstra Algorithm",
                    "source_reference": "Lecture_04_Recursion.mp4 — Timestamp 28:15"
                }
            ]
