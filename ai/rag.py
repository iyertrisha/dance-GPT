"""
RAG orchestration: retrieval (hybrid RRF, soft level), rerank, CRAG, Groq generation.
"""

import json
import os
import re
from typing import Any, List, Optional, Set, Tuple

from dotenv import load_dotenv

load_dotenv()

from embeddings import EmbeddingService
from lancedb_client import LanceDBClient
from openai import OpenAI
from rerank import RerankerService

# Groq config
GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are an AI tutor for Bharatanatyam Gandharva exams. Answer questions based on the exam study materials provided below. Be concise and exam-focused. If the context does not contain relevant information, say "I don't have information on that in the provided materials" rather than guessing."""

NO_MATERIAL_REPLY = (
    "I don't have information on that in the provided materials. "
    "Try rephrasing your question or asking about a specific syllabus topic."
)


def _truthy(name: str, default: str = "1") -> bool:
    return os.environ.get(name, default).lower() in ("1", "true", "yes", "on")


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _float_env(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _groq_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)


def _expand_queries_mqe(
    client: OpenAI,
    question: str,
    level: str,
    num_variants: int,
) -> List[str]:
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": (
                    f"You are helping a {level}-level Bharatanatyam Gandharva exam student "
                    "find study material.\n\n"
                    f"Original question: {question}\n\n"
                    f"Write exactly {num_variants} short search queries (one line each, no numbering) "
                    "that would retrieve relevant textbook or syllabus content. "
                    "Use different wording from the original when possible."
                ),
            }
        ],
        temperature=0.3,
        max_tokens=200,
    )
    raw = (resp.choices[0].message.content or "").strip()
    lines = [ln.strip() for ln in raw.splitlines() if ln.strip()]
    # Strip leading bullets / numbers
    cleaned = []
    for ln in lines:
        ln = re.sub(r"^[\d.\)\-\*]+\s*", "", ln).strip()
        if ln:
            cleaned.append(ln)
    return cleaned[:num_variants]


def _hyde_passage(client: OpenAI, question: str, level: str) -> str:
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": (
                    f"You are a {level}-level Bharatanatyam theory student answering an exam question.\n\n"
                    f"Question: {question}\n\n"
                    "Write a short hypothetical paragraph (3–5 sentences) that could appear in a syllabus "
                    "or textbook and directly addresses the question. Use precise dance-theory terms. "
                    "Output only the paragraph, no preamble."
                ),
            }
        ],
        temperature=0.4,
        max_tokens=350,
    )
    return (resp.choices[0].message.content or "").strip()


def _grade_relevance(
    client: OpenAI,
    question: str,
    chunk_texts: List[str],
) -> str:
    if not chunk_texts:
        return "irrelevant"
    preview = "\n---\n".join(t[:1200] for t in chunk_texts[:4])
    resp = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Question: {question}\n\n"
                    f"Retrieved excerpts from study materials:\n{preview}\n\n"
                    "Are these excerpts useful to answer the question accurately?\n"
                    "Reply with exactly one word: relevant, irrelevant, or ambiguous."
                ),
            }
        ],
        temperature=0.0,
        max_tokens=5,
    )
    word = (resp.choices[0].message.content or "").strip().lower()
    if "irrelevant" in word:
        return "irrelevant"
    if "ambiguous" in word:
        return "ambiguous"
    if "relevant" in word:
        return "relevant"
    return "ambiguous"


def _dedupe_chunks_by_id(chunks: List[dict]) -> List[dict]:
    seen: Set[str] = set()
    out: List[dict] = []
    for c in chunks:
        cid = c.get("id") or ""
        if cid:
            if cid in seen:
                continue
            seen.add(cid)
        out.append(c)
    return out


def _collect_retrieval_queries(
    client: Optional[OpenAI],
    question: str,
    level: str,
) -> List[str]:
    queries = [question]
    if client and _truthy("RAG_ENABLE_MQE", "0"):
        n = max(1, min(5, _int_env("RAG_MQE_VARIANTS", 3)))
        try:
            extra = _expand_queries_mqe(client, question, level, n)
            for q in extra:
                if q and q not in queries:
                    queries.append(q)
        except Exception:
            pass
    if client and _truthy("RAG_ENABLE_HYDE", "0"):
        try:
            hypo = _hyde_passage(client, question, level)
            if hypo and hypo not in queries:
                queries.append(hypo)
        except Exception:
            pass
    return queries


def _retrieve_for_vector(
    lancedb: LanceDBClient,
    embedder: EmbeddingService,
    query_text: str,
    original_question: str,
    level: Optional[str],
    retrieve_k: int,
    level_mode: str,
    level_penalty: float,
    hybrid_rrf: bool,
    rrf_k: int,
    two_stage_min: int,
    use_two_stage: bool,
) -> List[dict]:
    effective_level = None if (level or "").strip().lower() in ("", "general") else level
    vec = embedder.embed(query_text)
    if use_two_stage:
        rows, _ = lancedb.query_two_stage(
            vector=vec,
            level=effective_level,
            retrieve_k=retrieve_k,
            hybrid_rrf=hybrid_rrf,
            rrf_k=rrf_k,
            question_text=original_question,
            level_penalty=level_penalty,
            min_rows=two_stage_min,
        )
        return rows
    return lancedb.query(
        vector=vec,
        level=effective_level,
        retrieve_k=retrieve_k,
        level_mode=level_mode,
        level_penalty=level_penalty,
        hybrid_rrf=hybrid_rrf,
        rrf_k=rrf_k,
        question_text=original_question,
    )


STUDY_CARDS_SYSTEM = """You are creating exam flashcards for Bharatanatyam Gandharva theory students.
Output ONLY a single JSON object, no markdown code fences, no explanation before or after.
The object must be: {{"cards":[{{"front":"string","back":"string"}}, ...]}}
Rules:
- Each "front" is a concise question, term, or prompt suitable for spaced repetition; "back" is a short, accurate answer.
- Ground every pair ONLY in the syllabus excerpts provided in the user message. Do not invent facts not present there.
- Prefer exactly {num_cards} pairs; if the excerpts contain fewer distinct facts, output as many well-grounded pairs as possible (at least one if the excerpts are on-topic).
- Use clear exam-focused wording. Keep backs under about 3 sentences when possible."""


def retrieve_syllabus_context(topic: str, level: str, top_n: int = 10) -> List[str]:
    """
    Embed topic query(ies), search LanceDB, optional rerank, return top chunk texts. No LLM answer step.
    """
    retrieve_k = max(5, _int_env("RAG_RETRIEVE_K", 24))
    level_penalty = _float_env("RAG_LEVEL_PENALTY", 0.15)
    rrf_k = max(1, _int_env("RAG_RRF_K", 60))
    hybrid_rrf = _truthy("RAG_ENABLE_HYBRID_RRF", "1")
    enable_rerank = _truthy("RAG_ENABLE_RERANK", "1")
    two_stage_min = max(1, _int_env("RAG_TWO_STAGE_MIN_ROWS", 3))

    level_mode_env = os.environ.get("RAG_LEVEL_MODE", "auto").lower().strip()
    use_two_stage = level_mode_env == "auto"
    level_mode = "soft" if level_mode_env == "soft" else "strict"

    embedder = EmbeddingService()
    lancedb = LanceDBClient()
    api_key = os.environ.get("GROQ_API_KEY")
    need_llm_early = bool(api_key) and (
        _truthy("RAG_ENABLE_MQE", "0") or _truthy("RAG_ENABLE_HYDE", "0")
    )
    mqe_client = _groq_client(api_key) if need_llm_early else None
    retrieval_queries = _collect_retrieval_queries(mqe_client, topic, level or "")

    merged: List[dict] = []
    for q in retrieval_queries:
        rows = _retrieve_for_vector(
            lancedb=lancedb,
            embedder=embedder,
            query_text=q,
            original_question=topic,
            level=level or None,
            retrieve_k=retrieve_k,
            level_mode=level_mode,
            level_penalty=level_penalty,
            hybrid_rrf=hybrid_rrf,
            rrf_k=rrf_k,
            two_stage_min=two_stage_min,
            use_two_stage=use_two_stage,
        )
        merged.extend(rows)

    merged = _dedupe_chunks_by_id(merged)
    take_n = max(1, top_n)
    if enable_rerank and merged:
        reranker = RerankerService()
        merged = reranker.rerank(topic, merged, top_n=take_n)
    else:
        merged = merged[:take_n]

    return [c.get("text", "") for c in merged if c.get("text")]


def _parse_cards_from_llm(raw: str) -> List[dict]:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```\s*$", "", text)
    data: Any = json.loads(text)
    if isinstance(data, dict) and "cards" in data:
        items = data["cards"]
    elif isinstance(data, list):
        items = data
    else:
        items = []
    out: List[dict] = []
    if not isinstance(items, list):
        return out
    for item in items:
        if not isinstance(item, dict):
            continue
        front = item.get("front")
        back = item.get("back")
        if isinstance(front, str) and isinstance(back, str):
            f, b = front.strip(), back.strip()
            if f and b:
                out.append({"front": f, "back": b})
    return out


def _verify_cards_grounded(
    client: OpenAI,
    chunk_texts: List[str],
    cards: List[dict],
) -> Tuple[List[dict], int]:
    """
    Return (supported_cards, dropped_count) by checking each card against source excerpts.
    """
    if not cards:
        return [], 0
    if not chunk_texts:
        return [], len(cards)

    preview = "\n---\n".join(t[:1400] for t in chunk_texts[:6])
    card_payload = [{"index": i, "front": c["front"], "back": c["back"]} for i, c in enumerate(cards)]
    request_messages = [
        {
            "role": "user",
            "content": (
                "You are validating flashcards for factual grounding.\n\n"
                f"Syllabus excerpts:\n{preview}\n\n"
                f"Flashcards to verify:\n{json.dumps(card_payload, ensure_ascii=False)}\n\n"
                "For each card, decide if the front/back pair is fully supported by the excerpts.\n"
                "Return ONLY JSON with this shape:\n"
                '{"verdicts":[{"index":0,"supported":true,"reason":"short"}]}\n'
                "Rules:\n"
                "- supported=true only if both question and answer are grounded in excerpts.\n"
                "- If missing or uncertain evidence, supported=false.\n"
                "- Keep reasons short."
            ),
        }
    ]
    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=request_messages,
            temperature=0.0,
            max_tokens=1200,
            response_format={"type": "json_object"},
        )
    except Exception:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=request_messages,
            temperature=0.0,
            max_tokens=1200,
        )

    raw = (resp.choices[0].message.content or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
        raw = re.sub(r"\s*```\s*$", "", raw)
    data = json.loads(raw)
    verdicts = data.get("verdicts", []) if isinstance(data, dict) else []
    supported_idx = {
        v.get("index")
        for v in verdicts
        if isinstance(v, dict)
        and isinstance(v.get("index"), int)
        and v.get("supported") is True
    }
    supported_cards = [c for i, c in enumerate(cards) if i in supported_idx]
    dropped_count = len(cards) - len(supported_cards)
    return supported_cards, dropped_count


def generate_study_cards(
    topic: str,
    level: str,
    num_cards: int = 10,
) -> Tuple[List[dict], Optional[str]]:
    """
    Retrieve syllabus chunks for topic/level, then ask Groq for JSON flashcards.
    Returns (cards as {front, back} dicts, optional warning message).
    """
    chunk_texts = retrieve_syllabus_context(topic, level or "", top_n=10)
    if not chunk_texts:
        return [], "No relevant syllabus excerpts were found for this topic."

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set")

    client = _groq_client(api_key)
    enable_card_sanity = _truthy("RAG_ENABLE_CARD_SANITY", "1")
    min_grounded = max(1, _int_env("RAG_CARD_MIN_GROUNDED", 3))

    if enable_card_sanity:
        relevance = _grade_relevance(
            client,
            f"Generate {level or 'general'} flashcards for topic: {topic}",
            chunk_texts,
        )
        if relevance != "relevant":
            return [], (
                "Retrieved syllabus excerpts were not reliable enough for grounded flashcards. "
                "Try a more specific topic or verify indexing for this level."
            )

    context = "\n\n---\n\n".join(chunk_texts)
    user_content = (
        f"Exam level: {level or 'unknown'}\n"
        f"Topic to master: {topic}\n\n"
        f"Syllabus excerpts (use ONLY these):\n{context}"
    )
    system = STUDY_CARDS_SYSTEM.format(num_cards=num_cards)

    base_messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]

    def _one_completion() -> str:
        try:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=base_messages,
                temperature=0.2,
                max_tokens=4096,
                response_format={"type": "json_object"},
            )
        except Exception:
            resp = client.chat.completions.create(
                model=GROQ_MODEL,
                messages=base_messages,
                temperature=0.2,
                max_tokens=4096,
            )
        return (resp.choices[0].message.content or "").strip()

    raw = _one_completion()
    cards: List[dict] = []
    try:
        cards = _parse_cards_from_llm(raw)
    except json.JSONDecodeError:
        raw2 = _one_completion()
        try:
            cards = _parse_cards_from_llm(raw2)
        except json.JSONDecodeError:
            raise RuntimeError("Model returned invalid JSON for flashcards") from None

    if not cards:
        return [], "Could not extract flashcards from the model response. Try another topic."

    cap = max(1, num_cards)
    cards = cards[:cap]

    if enable_card_sanity:
        try:
            cards, dropped = _verify_cards_grounded(client, chunk_texts, cards)
        except Exception as e:
            return [], f"Card sanity check failed: {e}"
        if len(cards) < min_grounded:
            return [], (
                f"Only {len(cards)} cards passed grounding checks (minimum {min_grounded}). "
                "Try a narrower topic or add more indexed syllabus content."
            )
        if dropped > 0:
            return cards, f"{dropped} unsupported card(s) were removed by grounding checks."

    return cards, None


def query_rag(
    question: str,
    level: str,
    history: Optional[List[dict]] = None,
) -> str:
    """
    Embed question(s), search LanceDB, rerank, optional CRAG, generate answer via Groq.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return "Error: GROQ_API_KEY is not set. Add it to your .env file."

    retrieve_k = max(5, _int_env("RAG_RETRIEVE_K", 24))
    context_k = max(1, _int_env("RAG_CONTEXT_K", 5))
    level_penalty = _float_env("RAG_LEVEL_PENALTY", 0.15)
    rrf_k = max(1, _int_env("RAG_RRF_K", 60))
    hybrid_rrf = _truthy("RAG_ENABLE_HYBRID_RRF", "1")
    enable_rerank = _truthy("RAG_ENABLE_RERANK", "1")
    enable_crag = _truthy("RAG_ENABLE_CRAG", "1")
    two_stage_min = max(1, _int_env("RAG_TWO_STAGE_MIN_ROWS", 3))

    level_mode_env = os.environ.get("RAG_LEVEL_MODE", "auto").lower().strip()
    use_two_stage = level_mode_env == "auto"
    level_mode = "soft" if level_mode_env == "soft" else "strict"

    try:
        embedder = EmbeddingService()
        lancedb = LanceDBClient()
        client = _groq_client(api_key)

        need_llm_early = _truthy("RAG_ENABLE_MQE", "0") or _truthy("RAG_ENABLE_HYDE", "0")
        mqe_client = client if need_llm_early else None
        retrieval_queries = _collect_retrieval_queries(mqe_client, question, level or "")

        merged: List[dict] = []
        for q in retrieval_queries:
            rows = _retrieve_for_vector(
                lancedb=lancedb,
                embedder=embedder,
                query_text=q,
                original_question=question,
                level=level or None,
                retrieve_k=retrieve_k,
                level_mode=level_mode,
                level_penalty=level_penalty,
                hybrid_rrf=hybrid_rrf,
                rrf_k=rrf_k,
                two_stage_min=two_stage_min,
                use_two_stage=use_two_stage,
            )
            merged.extend(rows)

        merged = _dedupe_chunks_by_id(merged)

        if enable_rerank and merged:
            reranker = RerankerService()
            merged = reranker.rerank(question, merged, top_n=context_k)
        else:
            merged = merged[:context_k]

        chunk_texts = [c.get("text", "") for c in merged if c.get("text")]

        if enable_crag and chunk_texts:
            grade = _grade_relevance(client, question, chunk_texts)
            if grade == "irrelevant":
                return NO_MATERIAL_REPLY
            if grade == "ambiguous":
                # Broaden: soft level, single embedding of original question only
                vec = embedder.embed(question)
                broad_k = min(retrieve_k * 2, 48)
                effective_level = None if (level or "").strip().lower() in ("", "general") else level
                merged = lancedb.query(
                    vector=vec,
                    level=effective_level,
                    retrieve_k=broad_k,
                    level_mode="soft",
                    level_penalty=level_penalty,
                    hybrid_rrf=hybrid_rrf,
                    rrf_k=rrf_k,
                    question_text=question,
                )
                if enable_rerank and merged:
                    reranker = RerankerService()
                    merged = reranker.rerank(question, merged, top_n=context_k)
                else:
                    merged = merged[:context_k]
                chunk_texts = [c.get("text", "") for c in merged if c.get("text")]
                grade2 = _grade_relevance(client, question, chunk_texts)
                if grade2 == "irrelevant":
                    return NO_MATERIAL_REPLY

        if chunk_texts:
            context = "\n\n".join(chunk_texts)
            context_section = f"Context:\n{context}"
        else:
            context_section = "No relevant study materials were found for this question."

        messages = [{"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{context_section}"}]

        if history:
            for msg in history[-6:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": question})

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
        )
        answer = response.choices[0].message.content or ""
        return answer.strip()

    except Exception as e:
        return f"Error generating response: {str(e)}"
