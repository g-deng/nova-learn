import httpx
import os
import json
from typing import List

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
model = "openai/gpt-4o-mini"  # "anthropic/claude-3-haiku" # "z-ai/glm-4.5-air:free"  # "google/gemini-2.0-flash-exp:free" #  # "openai/gpt-3.5-turbo" "openai/gpt-oss-20b:free"
temperature = 0.2


async def extract_topics(
    subject: str, description: str | None, avoid_topics: List[str] = []
) -> dict:
    prompt = (
        f"Subject: {subject}\n"
        f"Description: {description}\n\n"
        "Extract a list of 8-18 high-level topics relevant to this subject. "
        "For each topic, return a short 1-2 sentence description explaining it. "
        "Format your output as a JSON object where keys are the topic names."
        "and values are the short descriptions. Do not include extra explanation outside the JSON object."
        "The following topics have already been extracted. Do not extract thm: "
        + ", ".join(avoid_topics)
        + "\n\n"
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    try:
        content = (
            response.json()["choices"][0]["message"]["content"]
            .strip()
            .replace("'", '"')
        )
        if not content.startswith("{") or not content.endswith("}"):
            start = content.find("{")
            end = content.rfind("}")
            if start == -1 or end == -1:
                raise ValueError("Invalid JSON format")
            content = content[start : end + 1]
        print("Content received:", content)
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
        "Only include edges you are confident in. Do not invent new topics. Do not explain anything. Do not create circular dependencies."
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }

    print("Attempting to infer dependencies:")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        if not content.startswith("[") or not content.endswith("]"):
            start = content.find("[")
            end = content.rfind("]")
            if start == -1 or end == -1:
                raise ValueError("Invalid JSON format")
            content = content[start : end + 1]
        edges = json.loads(content.replace("'", '"'))
        if isinstance(edges, list) and all(
            isinstance(pair, list) and len(pair) == 2 for pair in edges
        ):
            return edges
        else:
            raise ValueError("Unexpected format")
    except Exception as e:
        print("Error parsing response:", e)
        return []


async def extract_flashcards(
    topic: str,
    num_cards: int = 10,
    avoid_fronts: List[str] = [],
    prompt: str | None = None,
) -> List[dict]:
    avoid_text = (
        ""
        if not avoid_fronts
        else (
            "The following flashcards have already been created. Do not create flashcards with these fronts: "
            + ", ".join(avoid_fronts)
            + "\n\n"
        )
    )
    llm_prompt = (
        "Generate a set of "
        + str(num_cards)
        + " flashcards for the following topic:\n\n"
        f"Topic: {topic}\n\n"
        "Each flashcard should have a 'front' (question/prompt), a 'back' (concise answer that may be in incomplete sentences, prefer 1 sentence or less), and an 'explanation' (2-3 sentence explanation of the answer). "
        "Format your output as a JSON array of objects with 'front', 'back', and 'explanation' fields. "
        "Do not include any extra text outside the JSON array.\n"
        f"{avoid_text}"
        f"{f'Consider the following context if relevant but disregard if it is unrelated to the topic: {prompt}' if prompt else ''}"
    )
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": llm_prompt}],
        "temperature": temperature,
    }

    print("Attempting to extract flashcards:")
    print(payload)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        if not content.startswith("[") or not content.endswith("]"):
            start = content.find("[")
            end = content.rfind("]")
            if start == -1 or end == -1:
                raise ValueError("Invalid JSON format")
            content = content[start : end + 1]
        cards = json.loads(content)
        print("Cards")
        print(cards)
        # Ensure each card has 'front', 'back', and 'explanation'
        if isinstance(cards, list) and all(
            isinstance(card, dict)
            and "front" in card
            and "back" in card
            and "explanation" in card
            for card in cards
        ):
            return cards
        else:
            raise ValueError(
                "Unexpected format: missing 'front', 'back', or 'explanation'"
            )
    except Exception as e:
        print(response.text)
        print("Error parsing response:", e)
        raise ValueError("Failed to extract flashcards")


async def create_multiple_choice_exam(
    title: str, topics: List[str], num_questions: int = 10, prompt: str | None = None
) -> List[dict]:
    prompt = (
        "Generate the questions for a multiple-choice exam titled '"
        + title
        + "' with "
        + str(num_questions)
        + " questions covering the following topics:\n\n"
        f"Topics: {topics}\n\n"
        "Each question should have 4 answer choices labeled 'A', 'B', 'C', and 'D', with one correct answer. "
        "Format your output as a JSON array of objects with 'text', 'choices' (a dict of options keyed by letter), 'topic_name' (the name of the topic), and 'answer' (the correct option letter). "
        "Do not include any extra text outside the JSON array."
        f"{f'Consider the following context if relevant but disregard if it is unrelated to the topic: {prompt}' if prompt else ''}"
    )

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
    }

    print("Attempting to create exam:")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    try:
        content = response.json()["choices"][0]["message"]["content"]
        if not content.startswith("[") or not content.endswith("]"):
            start = content.find("[")
            end = content.rfind("]")
            if start == -1 or end == -1:
                raise ValueError("Invalid JSON format")
            content = content[start : end + 1]
        questions = json.loads(content)
        print("Questions")
        print(questions)
        if isinstance(questions, list) and all(isinstance(q, dict) for q in questions):
            return questions
        else:
            raise ValueError("Unexpected format")
    except Exception as e:
        print("Error parsing response:", e)
        print(response.text)
        return []


async def chat_with_context(
    messages: List[dict],
    attachments: List[dict] | None = None,
    model_name: str = model,
    temperature: float = temperature,
) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    }

    # If attachments exist, prepend a concise system message
    system_prompt = None
    if attachments:
        attachment_texts = []
        for a in attachments:
            if a["type"] == "exam_question":
                attachment_texts.append(f"Exam Question: {a['text']}")
            elif a["type"] == "flashcard":
                attachment_texts.append(f"Flashcard: {a['text']}")
            elif a["type"] == "topic":
                attachment_texts.append(f"Topic: {a['text']}")
        system_prompt = {
            "role": "system",
            "content": (
                "The user has attached the following context. "
                "Respond concisely, maximum 5 sentences.\n\n"
                + "\n".join(attachment_texts)
            ),
        }

    final_messages = []
    if system_prompt:
        final_messages.append(system_prompt)
    final_messages.extend(messages)

    payload = {
        "model": model_name,
        "messages": final_messages,
        "temperature": 0.6,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )

    try:
        content = response.json()["choices"][0]["message"]["content"].strip()
        return content
    except Exception as e:
        print("Error in chat_with_context:", e)
        print("Raw response:", response.text)
        raise


async def generate_chat_title(messages: list[dict], attachments: list[dict]) -> str:
    headers = {"Authorization": f"Bearer {OPENROUTER_API_KEY}"}
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "The user has attached the following context. "
                    + "\n".join(
                        [
                            f"{a['type'].replace('_', ' ').title()}: {a['text']}"
                            for a in attachments
                        ]
                    )
                ),
            },
            {
                "role": "system",
                "content": (
                    "You are to generate a short, descriptive title (maximum 6 words) "
                    "for the following chat. Return only the title, no quotes, no punctuation."
                ),
            },
            {
                "role": "user",
                "content": "\n".join([m["content"] for m in messages[:3]]),
            },
        ],
        "temperature": 0.5,
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers,
        )
    return response.json()["choices"][0]["message"]["content"].strip()
