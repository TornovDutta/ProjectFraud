import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.core.security import sanitize_sensitive_data

logger = logging.getLogger("cybersathi.hf_ai")

VALID_PAYMENT_METHODS = {
    "UPI",
    "DEBIT_CARD",
    "CREDIT_CARD",
    "NET_BANKING",
    "AEPS",
    "WALLET",
    "OTHER",
}

PAYMENT_METHOD_ALIASES = {
    "GPAY": "UPI",
    "GOOGLE PAY": "UPI",
    "PHONEPE": "UPI",
    "PAYTM": "UPI",
    "BHIM": "UPI",
    "CARD": "DEBIT_CARD",
    "ATM CARD": "DEBIT_CARD",
    "DEBIT": "DEBIT_CARD",
    "CREDIT": "CREDIT_CARD",
    "NETBANKING": "NET_BANKING",
    "BANK TRANSFER": "NET_BANKING",
    "IMPS": "NET_BANKING",
    "NEFT": "NET_BANKING",
    "RTGS": "NET_BANKING",
}

VALID_FRAUD_TYPES = {
    "UPI_FRAUD",
    "PHISHING",
    "OTP_SCAM",
    "FAKE_CUSTOMER_CARE",
    "JOB_INVESTMENT_SCAM",
    "CREDIT_DEBIT_CARD_FRAUD",
    "LOAN_APP_EXTORTION",
    "IDENTITY_THEFT",
    "OTHER",
}

PLACEHOLDER_STRINGS = {"none", "null", "n/a", "na", "unknown", "not provided", "pending", ""}

EMOJI_PATTERN = re.compile(
    r"[\U0001F300-\U0001FAFF\U0001F1E6-\U0001F1FF\U00002600-\U000027BF\U0000FE0F]"
)


def strip_emojis(text: str) -> str:
    """Removes emoji characters while preserving English, Hindi, and Bengali text."""
    if not text:
        return text
    cleaned = EMOJI_PATTERN.sub("", text)
    # Collapse repeated horizontal spaces introduced by removal, preserve newlines
    cleaned = re.sub(r"[^\S\r\n]{2,}", " ", cleaned)
    return cleaned.strip()


def parse_json_object(raw_text: str) -> Optional[Dict[str, Any]]:
    """Extracts and parses a JSON object from raw LLM output."""
    if not raw_text:
        return None
    text = raw_text.strip()

    # Strip markdown code fences if present
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    # Fallback: locate outermost braces
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(text[start : end + 1])
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            return None

    return None


class HuggingFaceAIService:
    """
    Hugging Face Inference API integration using Qwen/Qwen2.5-72B-Instruct.
    Provides multilingual cyber-fraud extraction, empathetic citizen guidance,
    formal narrative drafting, and threat/scam intelligence with resilient local fallback.
    """

    @classmethod
    def get_model_name(cls) -> str:
        return (settings.HF_MODEL or "Qwen/Qwen2.5-72B-Instruct").strip()

    @classmethod
    def is_configured(cls) -> bool:
        return bool((settings.HF_TOKEN or "").strip())

    @classmethod
    async def chat_completions(
        cls,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 500,
        timeout: float = 12.0,
    ) -> Optional[str]:
        """
        Calls Hugging Face Router Chat Completions API with configured HF_TOKEN and HF_MODEL.
        Returns response text or None on unconfigured token / upstream failure.
        """
        token = (settings.HF_TOKEN or "").strip()
        if not token:
            return None

        model = cls.get_model_name()
        url = (settings.HF_API_BASE_URL or "https://router.huggingface.co/v1/chat/completions").strip()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, headers=headers, json=payload)

            if resp.status_code == 200:
                body = resp.json()
                choices = body.get("choices") or []
                if choices and isinstance(choices[0], dict):
                    content = (choices[0].get("message") or {}).get("content")
                    if isinstance(content, str) and content.strip():
                        return strip_emojis(content)
                logger.warning("Hugging Face returned 200 without message content.")
                return None

            err_preview = resp.text[:200].replace("\n", " ")
            logger.warning(
                "Hugging Face API non-200 status=%s model=%s detail=%s",
                resp.status_code,
                model,
                err_preview,
            )
            return None
        except Exception as exc:
            logger.warning("Hugging Face API request failed (%s): %s", model, exc)
            return None

    @classmethod
    def _merge_validated_fields(
        cls,
        ai_fields: Dict[str, Any],
        baseline_extracted: Dict[str, Any],
        previously_extracted: Dict[str, Any],
        explicit_upi_kw: bool = False,
    ) -> Dict[str, Any]:
        """
        Safely merges validated Qwen extractions onto deterministic baseline fields.
        """
        merged = dict(baseline_extracted)
        if not isinstance(ai_fields, dict):
            return merged

        # 1. fraud_amount
        if not merged.get("fraud_amount") and ai_fields.get("fraud_amount") is not None:
            raw_amt = ai_fields.get("fraud_amount")
            try:
                if isinstance(raw_amt, str):
                    raw_amt = re.sub(r"[^\d.]", "", raw_amt.replace(",", ""))
                amt_val = float(raw_amt)
                if 1.0 <= amt_val <= 100_000_000.0:
                    merged["fraud_amount"] = amt_val
            except (TypeError, ValueError):
                pass

        # 2. payment_method
        if not merged.get("payment_method") and ai_fields.get("payment_method"):
            raw_pm = str(ai_fields["payment_method"]).strip().upper().replace("-", "_").replace(" ", "_")
            if raw_pm in VALID_PAYMENT_METHODS:
                merged["payment_method"] = raw_pm
            else:
                norm_key = str(ai_fields["payment_method"]).strip().upper()
                if norm_key in PAYMENT_METHOD_ALIASES:
                    merged["payment_method"] = PAYMENT_METHOD_ALIASES[norm_key]

        # 3. fraud_type (allow Qwen to refine generic UPI_FRAUD default when user didn't mention UPI explicitly)
        raw_ft = ai_fields.get("fraud_type")
        if raw_ft:
            ft_norm = str(raw_ft).strip().upper().replace(" ", "_")
            if ft_norm in VALID_FRAUD_TYPES:
                had_prior_ft = bool(previously_extracted.get("fraud_type"))
                if not merged.get("fraud_type"):
                    merged["fraud_type"] = ft_norm
                elif (
                    not had_prior_ft
                    and not explicit_upi_kw
                    and merged.get("fraud_type") == "UPI_FRAUD"
                    and ft_norm not in {"UPI_FRAUD", "OTHER"}
                ):
                    merged["fraud_type"] = ft_norm

        # 4. transaction_id
        if not merged.get("transaction_id") and ai_fields.get("transaction_id"):
            tx = str(ai_fields["transaction_id"]).strip()
            if tx.lower() not in PLACEHOLDER_STRINGS and re.match(r"^[A-Za-z0-9\-]{6,30}$", tx) and any(c.isdigit() for c in tx):
                merged["transaction_id"] = tx

        # 5. suspect_phone
        if not merged.get("suspect_phone") and ai_fields.get("suspect_phone"):
            raw_phone = str(ai_fields["suspect_phone"]).strip()
            if raw_phone.lower() not in PLACEHOLDER_STRINGS:
                digits = re.sub(r"\D", "", raw_phone)
                if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
                    merged["suspect_phone"] = digits[2:]
                elif len(digits) == 10 and digits[0] in "6789":
                    merged["suspect_phone"] = digits
                elif raw_phone.startswith("+") and 8 <= len(digits) <= 15:
                    merged["suspect_phone"] = raw_phone

        # 6. suspect_upi_id
        if not merged.get("suspect_upi_id") and ai_fields.get("suspect_upi_id"):
            upi = str(ai_fields["suspect_upi_id"]).strip()
            if upi.lower() not in PLACEHOLDER_STRINGS and re.match(r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$", upi):
                merged["suspect_upi_id"] = upi

        # 7. incident_date (prefer YYYY-MM-DD)
        if not merged.get("incident_date") and ai_fields.get("incident_date"):
            dt_val = str(ai_fields["incident_date"]).strip()
            if dt_val.lower() not in PLACEHOLDER_STRINGS:
                try:
                    datetime.strptime(dt_val, "%Y-%m-%d")
                    merged["incident_date"] = dt_val
                except ValueError:
                    if len(dt_val) <= 25:
                        merged["incident_date"] = dt_val

        # 8. incident_time
        if not merged.get("incident_time") and ai_fields.get("incident_time"):
            tm_val = str(ai_fields["incident_time"]).strip()
            if tm_val.lower() not in PLACEHOLDER_STRINGS and len(tm_val) <= 30:
                merged["incident_time"] = tm_val

        return merged

    @classmethod
    async def analyze_chat_turn(
        cls,
        clean_user_message: str,
        previously_extracted: Dict[str, Any],
        baseline_extracted: Dict[str, Any],
        missing_after_baseline: List[str],
        language: str = "English",
        history: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Uses Qwen/Qwen2.5-72B-Instruct via Hugging Face Router to extract structured
        cyber fraud details and generate an empathetic follow-up response in the user's language.
        """
        model = cls.get_model_name()
        sanitized_msg, _, _ = sanitize_sensitive_data(clean_user_message)

        if not cls.is_configured():
            return {
                "extracted_fields": baseline_extracted,
                "assistant_reply": None,
                "used_ai": False,
                "provider": "local_fallback",
                "model": model,
            }

        today_str = datetime.now().strftime("%Y-%m-%d")
        lang = language if language in {"English", "Hindi", "Bengali"} else "English"

        # Compact safe representation of previously collected state
        state_summary = {
            k: baseline_extracted.get(k)
            for k in (
                "fraud_amount",
                "fraud_type",
                "payment_method",
                "incident_date",
                "incident_time",
                "transaction_id",
                "suspect_phone",
                "suspect_upi_id",
            )
            if baseline_extracted.get(k) is not None
        }

        history_lines: List[str] = []
        if history:
            for item in history[-4:]:
                sender = item.get("sender", "user")
                raw_t = str(item.get("text", "")).strip()
                safe_t, _, _ = sanitize_sensitive_data(raw_t)
                if safe_t:
                    history_lines.append(f"{sender}: {safe_t[:250]}")

        system_prompt = (
            "You are CyberSathi, an official empathetic Cyber Fraud Complaint Assistant for Indian citizens "
            "helping victims report financial fraud to the 1930 Helpline (CFCFRMS) and cybercrime.gov.in.\n"
            f"Today's date is {today_str}.\n"
            "STRICT RULES:\n"
            f"1. Respond ONLY in {lang} (English, Hindi, or Bengali). Never mix other languages unless citing UTR/UPI/1930.\n"
            "2. NEVER use any emojis.\n"
            "3. NEVER ask for UPI PIN, ATM PIN, OTP, CVV, or banking passwords.\n"
            "4. Never invent or guess transaction IDs, phone numbers, UPI IDs, or amounts not clearly stated by the citizen.\n"
            "5. If the fraud happened today or very recently and alert was not yet shown, briefly urge dialing 1930 immediately.\n"
            "6. Ask concisely for ONLY the single highest-priority missing field needed to draft the complaint: "
            "fraud_amount, payment_method, incident_date, or transaction_id/suspect details. If all core fields are present, "
            "confirm that the draft complaint is ready for review.\n"
            "7. Output VALID JSON ONLY (no markdown, no explanation outside JSON) with exact schema:\n"
            "{\n"
            '  "extracted": {\n'
            '    "fraud_amount": number or null,\n'
            '    "fraud_type": one of ["UPI_FRAUD","PHISHING","OTP_SCAM","FAKE_CUSTOMER_CARE","JOB_INVESTMENT_SCAM","CREDIT_DEBIT_CARD_FRAUD","LOAN_APP_EXTORTION","IDENTITY_THEFT","OTHER"] or null,\n'
            '    "payment_method": one of ["UPI","DEBIT_CARD","CREDIT_CARD","NET_BANKING","AEPS","WALLET","OTHER"] or null,\n'
            '    "incident_date": "YYYY-MM-DD" or null,\n'
            '    "incident_time": string or null,\n'
            '    "transaction_id": string or null,\n'
            '    "suspect_phone": string or null,\n'
            '    "suspect_upi_id": string or null\n'
            "  },\n"
            '  "assistant_reply": "string"\n'
            "}"
        )

        user_prompt = (
            f"Language: {lang}\n"
            f"Already extracted baseline fields: {json.dumps(state_summary, ensure_ascii=False)}\n"
            f"Currently missing fields: {json.dumps(missing_after_baseline)}\n"
            f"Alert already shown earlier: {bool(previously_extracted.get('_alert_shown'))}\n"
        )
        if history_lines:
            user_prompt += "Recent turns:\n" + "\n".join(history_lines) + "\n"
        user_prompt += f"Latest citizen message: {sanitized_msg}"

        raw_response = await cls.chat_completions(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.15,
            max_tokens=450,
            timeout=12.0,
        )

        if not raw_response:
            return {
                "extracted_fields": baseline_extracted,
                "assistant_reply": None,
                "used_ai": False,
                "provider": "huggingface",
                "model": model,
            }

        parsed = parse_json_object(raw_response)
        if not parsed:
            logger.warning("Qwen output could not be parsed as JSON; using deterministic fallback.")
            return {
                "extracted_fields": baseline_extracted,
                "assistant_reply": None,
                "used_ai": False,
                "provider": "huggingface",
                "model": model,
            }

        lower_msg = sanitized_msg.lower()
        explicit_upi_kw = any(w in lower_msg for w in ("upi", "qr", "gpay", "google pay", "phonepe", "paytm", "bhim"))
        merged = cls._merge_validated_fields(
            parsed.get("extracted") or {},
            baseline_extracted,
            previously_extracted,
            explicit_upi_kw=explicit_upi_kw,
        )

        reply = parsed.get("assistant_reply")
        if isinstance(reply, str):
            reply = strip_emojis(reply).strip()
        else:
            reply = None

        # Safety guard: ensure AI reply never accidentally asks for PIN/OTP
        if reply and re.search(r"\b(?:share|enter|provide|tell|give)\b.{0,30}\b(?:your\s+)?(?:pin|otp|cvv|password)\b", reply, re.IGNORECASE):
            reply = None

        return {
            "extracted_fields": merged,
            "assistant_reply": reply or None,
            "used_ai": bool(reply),
            "provider": "huggingface",
            "model": model,
        }

    @classmethod
    async def enhance_complaint_summary(cls, complaint: Dict[str, Any]) -> Optional[str]:
        """
        Uses Qwen/Qwen2.5-72B-Instruct to polish the factual incident narrative into a clear,
        chronological third-person paragraph for Section 5 of the cybercrime.gov.in petition.
        Returns None cleanly if Hugging Face is unavailable.
        """
        if not cls.is_configured():
            return None

        raw_desc = str(complaint.get("incident_description") or "").strip()
        if not raw_desc:
            return None
        safe_desc, _, _ = sanitize_sensitive_data(raw_desc)

        facts = {
            "fraud_type": complaint.get("fraud_type"),
            "fraud_amount": complaint.get("fraud_amount"),
            "payment_method": complaint.get("payment_method"),
            "incident_date": complaint.get("incident_date"),
            "incident_time": complaint.get("incident_time"),
            "transaction_id": complaint.get("transaction_id"),
            "suspect_phone": complaint.get("suspect_phone"),
            "suspect_upi_id": complaint.get("suspect_upi_id"),
            "raw_statement": safe_desc,
        }

        system_prompt = (
            "You draft formal, objective cybercrime petition summaries for India's National Cyber Crime Reporting Portal "
            "(cybercrime.gov.in). Rewrite the citizen's factual statement into a concise, chronological 2-4 sentence third-person "
            "legal summary describing the modus operandi and unauthorized financial loss. "
            "Do NOT invent any dates, amounts, phone numbers, UPI IDs, or statutory sections not provided. Do NOT use emojis. "
            "Return plain text only."
        )

        result = await cls.chat_completions(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(facts, ensure_ascii=False)},
            ],
            temperature=0.1,
            max_tokens=300,
            timeout=12.0,
        )
        return strip_emojis(result) if result else None

    @classmethod
    async def analyze_fraud_risk_ai(
        cls,
        query: str,
        query_type: str,
        baseline_result: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Augments deterministic FraudRiskScanner results with Qwen/Qwen2.5-72B-Instruct
        analysis for novel or multilingual social engineering patterns.
        Never downgrades deterministic detections.
        """
        enriched = dict(baseline_result)
        enriched["ai_provider"] = "huggingface" if cls.is_configured() else "local_rules"
        enriched["ai_model"] = cls.get_model_name()
        enriched["ai_enhanced"] = False

        if not cls.is_configured():
            return enriched

        safe_query, _, _ = sanitize_sensitive_data(query)
        system_prompt = (
            "You are a cyber fraud analyst protecting Indian citizens from financial scams (UPI, phishing, "
            "digital arrest, fake customer care, malicious APK, loan apps, courier scams).\n"
            "Analyze the user's suspicious input (phone, UPI ID, URL, or SMS/WhatsApp message) and output JSON ONLY:\n"
            "{\n"
            '  "risk_score": integer 10 to 99,\n'
            '  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",\n'
            '  "category_title": short plain-text title,\n'
            '  "additional_red_flags": [up to 2 concise red-flag strings],\n'
            '  "additional_advisories": [up to 2 concise protective advisory strings],\n'
            '  "ai_summary": "1-2 sentence plain analysis without emojis"\n'
            "}\n"
            "Never include emojis."
        )
        user_prompt = (
            f"Detected Input Type: {baseline_result.get('query_type', query_type)}\n"
            f"Rule Baseline Score: {baseline_result.get('risk_score')} ({baseline_result.get('risk_level')})\n"
            f"Suspicious Input: {safe_query[:1000]}"
        )

        raw = await cls.chat_completions(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=320,
            timeout=10.0,
        )
        parsed = parse_json_object(raw or "")
        if not parsed:
            return enriched

        # Merge scores monotonically (never weaken rule engine findings)
        try:
            ai_score = int(parsed.get("risk_score", 0))
            if 10 <= ai_score <= 99 and ai_score > int(enriched.get("risk_score", 0)):
                enriched["risk_score"] = ai_score
        except (TypeError, ValueError):
            pass

        score = enriched["risk_score"]
        if score >= 70:
            enriched["risk_level"] = "CRITICAL"
        elif score >= 45:
            enriched["risk_level"] = "HIGH"
        elif score >= 25:
            enriched["risk_level"] = "MEDIUM"
        else:
            enriched["risk_level"] = "LOW"

        if (
            enriched.get("category") == "GENERAL_SUSPICIOUS"
            and isinstance(parsed.get("category_title"), str)
            and parsed["category_title"].strip()
        ):
            enriched["category_title"] = strip_emojis(parsed["category_title"])

        flags = list(enriched.get("red_flags") or [])
        for f in parsed.get("additional_red_flags") or []:
            if isinstance(f, str):
                clean_f = strip_emojis(f)
                if clean_f and clean_f not in flags:
                    flags.append(clean_f)
        enriched["red_flags"] = flags[:6]

        advisories = list(enriched.get("advisories") or [])
        for adv in parsed.get("additional_advisories") or []:
            if isinstance(adv, str):
                clean_adv = strip_emojis(adv)
                if clean_adv and clean_adv not in advisories:
                    advisories.append(clean_adv)
        enriched["advisories"] = advisories[:5]

        if isinstance(parsed.get("ai_summary"), str) and parsed["ai_summary"].strip():
            enriched["ai_summary"] = strip_emojis(parsed["ai_summary"])

        enriched["ai_enhanced"] = True
        return enriched

    @classmethod
    async def transcribe_audio_hf(
        cls,
        file_bytes: bytes,
        content_type: str = "audio/m4a",
    ) -> str:
        """
        Optional Speech-to-Text via Hugging Face Inference API if HF_ASR_MODEL is configured.
        Returns empty string if unconfigured or unavailable (never demo data).
        """
        token = (settings.HF_TOKEN or "").strip()
        asr_model = (settings.HF_ASR_MODEL or "").strip()
        if not token or not asr_model or not file_bytes:
            return ""

        url = f"https://router.huggingface.co/hf-inference/models/{asr_model}"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": content_type,
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(url, headers=headers, content=file_bytes)
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict) and isinstance(data.get("text"), str):
                    return strip_emojis(data["text"])
            else:
                logger.warning("Hugging Face ASR non-200 status=%s", resp.status_code)
        except Exception as exc:
            logger.warning("Hugging Face ASR request failed: %s", exc)
        return ""
