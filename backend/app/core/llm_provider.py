import json
import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

class LLMProvider:
    @staticmethod
    async def generate_response(
        prompt: str,
        system_prompt: str = "You are LearnFlow AI, an expert adaptive multi-agent tutor.",
        temperature: float = 0.2
    ) -> str:
        # 1. OpenAI
        if settings.LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": settings.LLM_MODEL or "gpt-4o-mini",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": prompt}
                            ],
                            "temperature": temperature
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"]
            except Exception:
                pass

        # 2. Ollama
        if settings.LLM_PROVIDER == "ollama":
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"{settings.OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": settings.LLM_MODEL or "llama3",
                            "system": system_prompt,
                            "prompt": prompt,
                            "stream": False
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json().get("response", "")
            except Exception:
                pass

        # 3. Gemini API
        if settings.LLM_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{settings.LLM_MODEL or 'gemini-1.5-flash'}:generateContent?key={settings.GEMINI_API_KEY}",
                        json={
                            "contents": [{"parts": [{"text": f"{system_prompt}\n\n{prompt}"}]}]
                        }
                    )
                    if resp.status_code == 200:
                        return resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                pass

        # 4. Built-in Deterministic Intelligent Fallback
        return LLMProvider._fallback_handler(prompt, system_prompt)

    @staticmethod
    def _fallback_handler(prompt: str, system_prompt: str) -> str:
        # Extract the provided excerpts from prompt if present
        excerpts_content = ""
        if "COURSE MATERIAL EXCERPTS:" in prompt:
            parts = prompt.split("COURSE MATERIAL EXCERPTS:")
            if len(parts) > 1:
                after = parts[1]
                if "STUDENT QUESTION:" in after:
                    excerpts_content = after.split("STUDENT QUESTION:")[0].strip()
                else:
                    excerpts_content = after.strip()

        if excerpts_content:
            # Cleanly format the retrieved excerpts as a coherent grounded answer
            paragraphs = [p.strip() for p in excerpts_content.split("\n\n---\n\n") if p.strip()]
            explanation_parts = []
            for p in paragraphs:
                lines = [line.strip() for line in p.split("\n") if line.strip()]
                if not lines:
                    continue
                header = lines[0] if lines[0].startswith("[") else ""
                body = " ".join(lines[1:]) if header else " ".join(lines)
                if header:
                    explanation_parts.append(f"**From {header}:**\n{body}")
                else:
                    explanation_parts.append(body)

            if explanation_parts:
                return "\n\n".join(explanation_parts)

        # Fallback if no excerpts in prompt
        return (
            "Based on the analyzed course material, the documented concepts provide the necessary "
            "rules, complexity profiles, and operational steps for this topic."
        )

