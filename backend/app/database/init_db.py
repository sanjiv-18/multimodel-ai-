import os
import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.database.session import SessionLocal, init_db_tables
from app.core.security import get_password_hash
from app.models.db_models import (
    User, Course, Material, DocumentChunk, Topic, Concept,
    LearnerMastery, Misconception, Recommendation
)
from app.rag.embeddings import EmbeddingService
from app.agents.knowledge_agent import KnowledgeOrganizationAgent
from app.agents.personalization_agent import PersonalizationAgent

def seed_database():
    init_db_tables()
    db: Session = SessionLocal()

    # 1. Create or get Demo User
    demo_user = db.query(User).filter(User.email == "demo@learnflow.ai").first()
    if not demo_user:
        demo_user = User(
            email="demo@learnflow.ai",
            hashed_password=get_password_hash("demo1234"),
            full_name="Alex Chen",
            role="student"
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    # 2. Create Demo Course
    demo_course = db.query(Course).filter(Course.title == "Data Structures & Algorithms").first()
    if not demo_course:
        demo_course = Course(
            title="Data Structures & Algorithms",
            description="Comprehensive guide to foundational data structures, algorithmic complexity, sorting, searching, recursion, trees, and graph traversal.",
            code="CS-201",
            user_id=demo_user.id
        )
        db.add(demo_course)
        db.commit()
        db.refresh(demo_course)

    # 3. Seed Materials & Document Chunks if not present
    existing_chunks = db.query(DocumentChunk).filter(DocumentChunk.course_id == demo_course.id).count()
    if existing_chunks == 0:
        # Create Material entries
        mat_pdf = Material(
            course_id=demo_course.id,
            title="Algorithms_Textbook.pdf",
            file_type="pdf",
            file_path="uploads/Algorithms_Textbook.pdf",
            file_size_bytes=4521000,
            status="completed"
        )
        mat_slides = Material(
            course_id=demo_course.id,
            title="LectureSlides_Algorithms.pptx",
            file_type="pptx",
            file_path="uploads/LectureSlides_Algorithms.pptx",
            file_size_bytes=2140000,
            status="completed"
        )
        mat_video1 = Material(
            course_id=demo_course.id,
            title="Lecture_03_Searching.mp4",
            file_type="video",
            file_path="uploads/Lecture_03_Searching.mp4",
            file_size_bytes=48900000,
            status="completed"
        )
        mat_video2 = Material(
            course_id=demo_course.id,
            title="Lecture_04_Recursion.mp4",
            file_type="video",
            file_path="uploads/Lecture_04_Recursion.mp4",
            file_size_bytes=52100000,
            status="completed"
        )

        db.add_all([mat_pdf, mat_slides, mat_video1, mat_video2])
        db.commit()
        db.refresh(mat_pdf)
        db.refresh(mat_slides)
        db.refresh(mat_video1)
        db.refresh(mat_video2)

        # Knowledge Base Chunks with precise source grounding metadata
        sample_chunks = [
            # PDF Chunks
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 42,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Searching Algorithms",
                "concept": "Binary Search",
                "content": "Binary Search is a divide-and-conquer search algorithm with O(log n) worst-case time complexity. Fundamental Prerequisite: The input array or list MUST be strictly sorted in monotonic order (ascending or descending). It repeatedly compares target with middle element."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 45,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Searching Algorithms",
                "concept": "Binary Search Implementation",
                "content": "In binary search implementation, calculate mid as low + (high - low) // 2 rather than (low + high) // 2 to avoid 32-bit integer overflow in fixed-width numeric environments."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 78,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Recursion & Backtracking",
                "concept": "Recursion Base Cases",
                "content": "Every recursive algorithm requires a valid base case. The base case specifies the terminating condition where no further recursive calls occur. Without a base case, recursion exhausts the call stack and triggers a StackOverflow runtime exception."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 85,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Recursion & Backtracking",
                "concept": "Tail Call Optimization",
                "content": "Tail recursion occurs when the recursive call is the final statement executed in the function. Modern optimizing compilers can reuse the existing stack frame, reducing auxiliary space complexity from O(n) to O(1)."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 112,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Sorting Algorithms",
                "concept": "Comparison Sort Lower Bound",
                "content": "Theorem: Any comparison-based sorting algorithm requires at least Omega(n log n) comparisons in the worst case. This theoretical bound is proven via decision tree leaf analysis where n! permutations require tree height >= log2(n!)."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 115,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Sorting Algorithms",
                "concept": "In-Place Sorting",
                "content": "An in-place sorting algorithm rearranges numbers within the input array using only O(1) auxiliary memory. Quick Sort is in-place with O(log n) recursion stack, whereas Merge Sort requires O(n) auxiliary temporary storage."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 160,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Graph Theory",
                "concept": "Breadth-First Search (BFS)",
                "content": "Breadth-First Search (BFS) traverses graphs level-by-level using a FIFO Queue. BFS is guaranteed to discover the shortest path in unweighted graphs because it explores all vertices at distance k before exploring distance k+1."
            },
            {
                "material_id": mat_pdf.id,
                "material_type": "pdf",
                "source_name": "Algorithms_Textbook.pdf",
                "page_number": 172,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Graph Theory",
                "concept": "Depth-First Search (DFS)",
                "content": "Depth-First Search (DFS) explores as deeply as possible along each branch before backtracking. Represented with an Adjacency List, DFS executes in O(V + E) time, making it ideal for topological sorting and cycle detection."
            },
            # Slide Chunks
            {
                "material_id": mat_slides.id,
                "material_type": "pptx",
                "source_name": "LectureSlides_Algorithms.pptx",
                "page_number": None,
                "slide_number": 27,
                "video_timestamp": None,
                "topic": "Searching Algorithms",
                "concept": "Binary Search",
                "content": "Slide 27: Binary Search Algorithm Steps: 1. Set low=0, high=N-1. 2. Calculate mid. 3. If array[mid] == target, found. 4. If array[mid] < target, search right half (low = mid + 1). 5. Else search left half (high = mid - 1)."
            },
            {
                "material_id": mat_slides.id,
                "material_type": "pptx",
                "source_name": "LectureSlides_Algorithms.pptx",
                "page_number": None,
                "slide_number": 44,
                "video_timestamp": None,
                "topic": "Recursion & Backtracking",
                "concept": "Call Stack Execution",
                "content": "Slide 44: Understanding Stack Frames in Recursion. Each function call allocates local variables, return parameters, and instruction pointers. The call stack operates in Last-In-First-Out (LIFO) order."
            },
            {
                "material_id": mat_slides.id,
                "material_type": "pptx",
                "source_name": "LectureSlides_Algorithms.pptx",
                "page_number": None,
                "slide_number": 58,
                "video_timestamp": None,
                "topic": "Sorting Algorithms",
                "concept": "Merge Sort",
                "content": "Slide 58: Merge Sort Divide-and-Conquer Paradigm. Divide array into two halves, recursively sort each half, and merge the two sorted halves in O(n) linear time. Overall guaranteed time: O(n log n) with stability."
            },
            {
                "material_id": mat_slides.id,
                "material_type": "pptx",
                "source_name": "LectureSlides_Algorithms.pptx",
                "page_number": None,
                "slide_number": 72,
                "video_timestamp": None,
                "topic": "Trees & Binary Search Trees",
                "concept": "BST Invariant",
                "content": "Slide 72: Binary Search Tree (BST) Properties: For every node X, all keys in Left Subtree are < X.key, and all keys in Right Subtree are > X.key. Inorder traversal (Left -> Root -> Right) visits elements in strictly sorted order."
            },
            # Video Transcript Chunks
            {
                "material_id": mat_video1.id,
                "material_type": "video",
                "source_name": "Lecture_03_Searching.mp4",
                "page_number": None,
                "slide_number": None,
                "video_timestamp": "14:22",
                "topic": "Searching Algorithms",
                "concept": "Binary Search Complexity",
                "content": "Lecture Video Clip [14:22]: Notice why Binary Search is so fast. In an array of 1 million elements, linear search takes up to 1,000,000 checks. Binary search finishes in at most 20 comparisons because log2(10^6) is approximately 20."
            },
            {
                "material_id": mat_video1.id,
                "material_type": "video",
                "source_name": "Lecture_03_Searching.mp4",
                "page_number": None,
                "slide_number": None,
                "video_timestamp": "31:40",
                "topic": "Sorting Algorithms",
                "concept": "Quick Sort Partitioning",
                "content": "Lecture Video Clip [31:40]: Quick sort partitioning places the pivot element in its exact final sorted spot and partitions elements smaller to the left and larger to the right. Average runtime is O(n log n)."
            },
            {
                "material_id": mat_video2.id,
                "material_type": "video",
                "source_name": "Lecture_04_Recursion.mp4",
                "page_number": None,
                "slide_number": None,
                "video_timestamp": "12:30",
                "topic": "Recursion & Backtracking",
                "concept": "Recursion Base Cases",
                "content": "Lecture Video Clip [12:30]: When writing recursive functions, always write and verify your base cases first before tackling the inductive step. The base case gives your function a stopping guarantee."
            },
            {
                "material_id": mat_video2.id,
                "material_type": "video",
                "source_name": "Lecture_04_Recursion.mp4",
                "page_number": None,
                "slide_number": None,
                "video_timestamp": "21:05",
                "topic": "Recursion & Backtracking",
                "concept": "Tree Recursion & Complexity",
                "content": "Lecture Video Clip [21:05]: Tree recursion occurs when a function makes multiple recursive calls per invocation, such as Fibonacci. Without caching results, the call tree blows up exponentially to O(2^n)."
            },
            {
                "material_id": mat_video2.id,
                "material_type": "video",
                "source_name": "Lecture_04_Recursion.mp4",
                "page_number": None,
                "slide_number": None,
                "video_timestamp": "28:15",
                "topic": "Graph Theory",
                "concept": "Dijkstra Algorithm",
                "content": "Lecture Video Clip [28:15]: Dijkstra's algorithm uses a greedy approach powered by a Min-Priority Queue to solve Single-Source Shortest Path on non-negative weighted graphs with O((V + E) log V) efficiency."
            }
        ]

        for sc in sample_chunks:
            vec = EmbeddingService.get_embedding_vector(sc["content"])
            chunk_record = DocumentChunk(
                course_id=demo_course.id,
                material_id=sc["material_id"],
                material_type=sc["material_type"],
                source_name=sc["source_name"],
                page_number=sc["page_number"],
                slide_number=sc["slide_number"],
                video_timestamp=sc["video_timestamp"],
                topic=sc["topic"],
                concept=sc["concept"],
                content=sc["content"],
                embedding_json=json.dumps(vec)
            )
            db.add(chunk_record)

        db.commit()

    # 4. Organize Course Knowledge
    knowledge_agent = KnowledgeOrganizationAgent(db)
    knowledge_agent.organize_course_knowledge(demo_course.id)

    # 5. Seed Learner Mastery Profile for Alex Chen
    topics = db.query(Topic).filter(Topic.course_id == demo_course.id).all()
    initial_scores = {
        "Arrays & Strings": 0.85,
        "Searching Algorithms": 0.68,
        "Sorting Algorithms": 0.90,
        "Recursion & Backtracking": 0.42,
        "Trees & Binary Search Trees": 0.72,
        "Graph Theory": 0.55
    }

    for t in topics:
        score = initial_scores.get(t.name, 0.50)
        mastery = db.query(LearnerMastery).filter(
            LearnerMastery.user_id == demo_user.id,
            LearnerMastery.course_id == demo_course.id,
            LearnerMastery.topic == t.name
        ).first()
        if not mastery:
            mastery = LearnerMastery(
                user_id=demo_user.id,
                course_id=demo_course.id,
                topic=t.name,
                concept=t.name,
                mastery_score=score,
                total_attempts=5,
                correct_attempts=int(score * 5)
            )
            db.add(mastery)

    # 6. Seed an Active Misconception for Demo
    existing_misc = db.query(Misconception).filter(
        Misconception.user_id == demo_user.id,
        Misconception.course_id == demo_course.id
    ).first()
    if not existing_misc:
        misc = Misconception(
            user_id=demo_user.id,
            course_id=demo_course.id,
            topic="Recursion & Backtracking",
            concept="Recursion Base Cases",
            misconception_name="Ignoring Call Stack Growth & Missing Base Case",
            description="Student assumes recursive calls without base cases terminate automatically without stack overflow.",
            count=2,
            resolved=False
        )
        db.add(misc)

    db.commit()

    # 7. Generate Initial Recommendations
    personalization_agent = PersonalizationAgent(db)
    personalization_agent.generate_recommendations(demo_user.id, demo_course.id)

    db.close()
    print("LearnFlow AI Database initialized and seeded successfully!")

if __name__ == "__main__":
    seed_database()
