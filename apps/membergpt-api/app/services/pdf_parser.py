import io
import re
import os
import json
from datetime import datetime, timezone
import pdfplumber
import requests

LB_TO_KG = 0.45359237


def extract_number(pattern, text):
    # search for a single regex pattern and return the float value
    match = re.search(pattern, text, re.IGNORECASE)
    if match:
        try:
            return float(match.group(1))
        except Exception:
            pass
    return None


def extract_date(text):
    # try common date formats found in DEXA reports
    match = re.search(
        r"(?:Scan\s*Date|Exam\s*Date|Date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4})",
        text, re.IGNORECASE
    )
    if match:
        try:
            return datetime.strptime(match.group(1).strip(), "%B %d, %Y")
        except ValueError:
            try:
                return datetime.strptime(match.group(1).strip(), "%b %d, %Y")
            except ValueError:
                pass

    match = re.search(
        r"(?:Scan\s*Date|Exam\s*Date|Date)\s*[:\-]?\s*(\d{1,2}/\d{1,2}/\d{2,4})",
        text, re.IGNORECASE
    )
    if match:
        raw = match.group(1).strip()
        try:
            return datetime.strptime(raw, "%m/%d/%Y")
        except ValueError:
            try:
                return datetime.strptime(raw, "%m/%d/%y")
            except ValueError:
                pass

    match = re.search(r"(\d{4}-\d{2}-\d{2})", text)
    if match:
        try:
            return datetime.strptime(match.group(1), "%Y-%m-%d")
        except ValueError:
            pass

    return datetime.now(timezone.utc)


def parse_with_regex(text):
    # extract weight
    weight_lb = extract_number(r"Weight\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*lb", text)
    if weight_lb is not None:
        weight_kg = weight_lb * LB_TO_KG
    else:
        weight_kg = extract_number(r"Weight\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text)

    # extract body fat %
    body_fat = extract_number(r"Total\s*Body\s*%?\s*Fat\s*(\d+(?:\.\d+)?)", text)
    if body_fat is None:
        body_fat = extract_number(r"Body\s*Fat\s*%?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text)

    # extract fat mass and lean mass from the body composition table
    # looking for a "Total" row with columns: fat, lean+bmc, total, %fat
    total_row = re.search(
        r"Body\s+Composition\s+Results[\s\S]*?\nTotal\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)",
        text, re.IGNORECASE
    )

    fat_mass_kg = None
    lean_mass_kg = None
    trunk_fat_kg = None
    trunk_lean_kg = None

    if total_row:
        fat_lb = float(total_row.group(1))
        lean_bmc_lb = float(total_row.group(2))
        total_lb = float(total_row.group(3))
        fat_mass_kg = fat_lb * LB_TO_KG
        lean_mass_kg = lean_bmc_lb * LB_TO_KG
        if body_fat is None:
            body_fat = float(total_row.group(4))
        if weight_kg is None:
            weight_kg = total_lb * LB_TO_KG

    if fat_mass_kg is None:
        fat_mass_kg = extract_number(r"Fat\s*Mass\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text)

    if lean_mass_kg is None:
        lean_mass_kg = extract_number(r"Lean\s*Mass\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text)
        if lean_mass_kg is None:
            lean_mass_kg = extract_number(r"Lean\s*Tissue\s*(?:\(kg\)|kg)?\s*[:\-]?\s*(\d+(?:\.\d+)?)", text)

    # trunk row
    trunk_row = re.search(
        r"Body\s+Composition\s+Results[\s\S]*?\nTrunk\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)",
        text, re.IGNORECASE
    )
    if trunk_row:
        trunk_fat_kg = float(trunk_row.group(1)) * LB_TO_KG
        trunk_lean_kg = float(trunk_row.group(2)) * LB_TO_KG

    # bone mass from BMC
    bmc_g = extract_number(
        r"\nTotal\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$",
        text
    )
    bone_mass_kg = None if bmc_g is None else bmc_g / 1000.0

    # visceral fat
    vat_g = extract_number(r"Est\.\s*VAT\s*Mass\s*\(g\)\s*(\d+(?:\.\d+)?)", text)
    visceral_fat_kg = None if vat_g is None else vat_g / 1000.0

    # android / gynoid
    android_fat = extract_number(
        r"Android\s*\(A\)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)", text
    )
    gynoid_fat = extract_number(
        r"Gynoid\s*\(G\)\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)", text
    )

    return {
        "weightKg": weight_kg,
        "bodyFatPercent": body_fat,
        "fatMassKg": fat_mass_kg,
        "leanMassKg": lean_mass_kg,
        "visceralFatMassKg": visceral_fat_kg,
        "boneMassKg": bone_mass_kg,
        "trunkFatKg": trunk_fat_kg,
        "trunkLeanMassKg": trunk_lean_kg,
        "androidFatPercent": android_fat,
        "gynoidFatPercent": gynoid_fat,
        "scanDate": extract_date(text),
    }


def parse_with_gemini(text):
    # use Gemini as a fallback to fill in missing fields
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key or not text.strip():
        return {}

    prompt = f"""
Extract these DEXA values from the text and return ONLY valid JSON:

{{
  "weightKg": number or null,
  "bodyFatPercent": number or null,
  "fatMassKg": number or null,
  "leanMassKg": number or null,
  "visceralFatMassKg": number or null,
  "boneMassKg": number or null,
  "trunkFatKg": number or null,
  "trunkLeanMassKg": number or null,
  "androidFatPercent": number or null,
  "gynoidFatPercent": number or null,
  "scanDate": "YYYY-MM-DD" or null
}}

Rules:
- Return only JSON, no explanation
- If a field is missing use null

DEXA TEXT:
{text}
"""

    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={gemini_key}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        start = raw_text.find("{")
        end = raw_text.rfind("}") + 1
        if start == -1 or end == 0:
            return {}

        parsed = json.loads(raw_text[start:end])
        result = {}

        for field in ["weightKg", "bodyFatPercent", "fatMassKg", "leanMassKg",
                      "visceralFatMassKg", "boneMassKg", "trunkFatKg", "trunkLeanMassKg",
                      "androidFatPercent", "gynoidFatPercent"]:
            if parsed.get(field) is not None:
                result[field] = float(parsed[field])

        if parsed.get("scanDate"):
            try:
                result["scanDate"] = datetime.fromisoformat(parsed["scanDate"])
            except Exception:
                pass

        return result
    except Exception:
        return {}


def parse_dexa_pdf_from_bytes(file_bytes: bytes):
    # extract text from the PDF
    full_text = ""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"
    except Exception:
        full_text = ""

    # run regex extraction first
    result = parse_with_regex(full_text)

    # fill in any missing fields using Gemini
    gemini_result = parse_with_gemini(full_text)
    for key, value in gemini_result.items():
        if result.get(key) is None:
            result[key] = value

    # return with safe defaults for required fields
    return {
        "weightKg": float(result.get("weightKg") or 0.0),
        "bodyFatPercent": float(result.get("bodyFatPercent") or 0.0),
        "fatMassKg": float(result.get("fatMassKg") or 0.0),
        "leanMassKg": float(result.get("leanMassKg") or 0.0),
        "visceralFatMassKg": float(result["visceralFatMassKg"]) if result.get("visceralFatMassKg") is not None else None,
        "boneMassKg": float(result["boneMassKg"]) if result.get("boneMassKg") is not None else None,
        "trunkFatKg": float(result["trunkFatKg"]) if result.get("trunkFatKg") is not None else None,
        "trunkLeanMassKg": float(result["trunkLeanMassKg"]) if result.get("trunkLeanMassKg") is not None else None,
        "androidFatPercent": float(result["androidFatPercent"]) if result.get("androidFatPercent") is not None else None,
        "gynoidFatPercent": float(result["gynoidFatPercent"]) if result.get("gynoidFatPercent") is not None else None,
        "scanDate": result.get("scanDate") or datetime.now(timezone.utc),
    }
