import os
import re
from typing import List, Dict, Any

class PDFProcessor:
    @staticmethod
    def extract_chunks(file_path: str, course_id: str, material_id: str, source_name: str) -> List[Dict[str, Any]]:
        chunks = []
        if not os.path.exists(file_path):
            return chunks
            
        try:
            # Check if text file (.txt, .md)
            if file_path.endswith(('.txt', '.md', '.markdown', '.text')):
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    full_text = f.read()
                
                # Split by sections or double newlines
                sections = re.split(r'\n(?=#{1,3}\s|\bChapter\s|\bTopic:|\bSection\s)', full_text)
                for page_num, sec in enumerate(sections, start=1):
                    clean_sec = sec.strip()
                    if len(clean_sec) < 10:
                        continue
                    
                    # Extract header/topic
                    lines = clean_sec.split('\n')
                    first_line = lines[0].replace('#', '').strip()
                    topic = first_line if len(first_line) < 60 else "Core Principles"
                    
                    chunks.append({
                        "course_id": course_id,
                        "material_id": material_id,
                        "material_type": "pdf",
                        "source_name": source_name,
                        "page_number": page_num,
                        "slide_number": None,
                        "video_timestamp": None,
                        "topic": topic,
                        "concept": first_line,
                        "content": clean_sec
                    })
                return chunks

            # Standard PDF parser
            import pypdf
            reader = pypdf.PdfReader(file_path)
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                cleaned_text = text.strip()
                if not cleaned_text:
                    continue
                
                paragraphs = [p.strip() for p in cleaned_text.split("\n\n") if len(p.strip()) > 30]
                if not paragraphs:
                    paragraphs = [cleaned_text]
                
                for idx, para in enumerate(paragraphs):
                    first_line = para.split("\n")[0].strip()
                    topic = first_line[:50] if len(first_line) < 50 and not first_line.endswith('.') else "Core Concepts"
                    
                    lower_para = para.lower()
                    if "array" in lower_para:
                        topic = "Arrays & Strings"
                    elif "search" in lower_para:
                        topic = "Searching Algorithms"
                    elif "sort" in lower_para:
                        topic = "Sorting Algorithms"
                    elif "recursion" in lower_para:
                        topic = "Recursion & Backtracking"
                    elif "tree" in lower_para:
                        topic = "Trees & Binary Search Trees"
                    elif "graph" in lower_para:
                        topic = "Graph Theory"
                        
                    chunks.append({
                        "course_id": course_id,
                        "material_id": material_id,
                        "material_type": "pdf",
                        "source_name": source_name,
                        "page_number": page_num,
                        "slide_number": None,
                        "video_timestamp": None,
                        "topic": topic,
                        "concept": topic,
                        "content": para
                    })
        except Exception:
            # Fallback for plain text
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            chunks.append({
                "course_id": course_id,
                "material_id": material_id,
                "material_type": "pdf",
                "source_name": source_name,
                "page_number": 1,
                "slide_number": None,
                "video_timestamp": None,
                "topic": "Core Notes",
                "concept": "Fundamental Principles",
                "content": content
            })
            
        return chunks
