import httpx
import os
import json
from typing import List

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
model = "openai/gpt-oss-20b:free" # "google/gemini-2.0-flash-exp:free" # "openai/gpt-3.5-turbo"

async def extract_topics(subject: str, description: str | None, avoid_topics: List[str] = []) -> dict:
    prompt = (
        f"Subject: {subject}\n"
        f"Description: {description}\n\n"
        "Extract a list of high-level topics relevant to this subject. "
        "For each topic, return a short 1-2 sentence description explaining it. "
        "Format your output as a JSON object where keys are the topic names "
        "and values are the short descriptions. Do not include extra explanation outside the JSON object."
        "The following topics have already been extracted: " + ", ".join(avoid_topics) + "\n\n"
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )

    try:
        content = response.json()["choices"][0]["message"]["content"].strip()
        topics_with_descriptions = json.loads(content)
        return {"topics": topics_with_descriptions}
    except Exception as e:
        return {"error": str(e), "raw_output": response.text}

    

async def infer_topic_dependencies(topics: List[str]) -> List[List[str]]:
    prompt = (
        f"Given the following list of topics:\n\n"
        f"{topics}\n\n"
        "Infer prerequisite relationships between them. Return a list of directed edges in the format:\n"
        '[["Topic A", "Topic B"], ...]\n\n'
        'Where an edge ["A", "B"] means that "A should be understood before B".\n'
        "Only include edges you are confident in. Do not invent new topics. Do not explain anything."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )

    content = response.json()["choices"][0]["message"]["content"]

    try:
        edges = json.loads(content.replace("'", '"'))
        if isinstance(edges, list) and all(isinstance(pair, list) and len(pair) == 2 for pair in edges):
            return edges
        else:
            raise ValueError("Unexpected format")
    except Exception as e:
        print("Error parsing response:", e)
        print("Raw content:", content)
        return []