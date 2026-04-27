from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.pdf_parser import parse_dexa_pdf_from_bytes

router = APIRouter()


@router.post("/parse")
async def parse_report(
    memberId: str = Form(...),
    uploadId: str = Form(...),
    file: UploadFile = File(...),
):
    try:
        contents = await file.read()
        parsed = parse_dexa_pdf_from_bytes(contents)

        # handle optional fields - return None if not found
        if parsed.get("visceralFatMassKg") is not None:
            visceral = float(parsed["visceralFatMassKg"])
        else:
            visceral = None

        if parsed.get("boneMassKg") is not None:
            bone = float(parsed["boneMassKg"])
        else:
            bone = None

        if parsed.get("trunkFatKg") is not None:
            trunk_fat = float(parsed["trunkFatKg"])
        else:
            trunk_fat = None

        if parsed.get("trunkLeanMassKg") is not None:
            trunk_lean = float(parsed["trunkLeanMassKg"])
        else:
            trunk_lean = None

        if parsed.get("androidFatPercent") is not None:
            android_fat = float(parsed["androidFatPercent"])
        else:
            android_fat = None

        if parsed.get("gynoidFatPercent") is not None:
            gynoid_fat = float(parsed["gynoidFatPercent"])
        else:
            gynoid_fat = None

        if parsed.get("scanDate") is not None:
            scan_date = parsed["scanDate"].isoformat()
        else:
            scan_date = None

        return {
            "ok": True,
            "memberId": memberId,
            "uploadId": uploadId,
            "parsed": {
                "weightKg": float(parsed.get("weightKg") or 0.0),
                "bodyFatPercent": float(parsed.get("bodyFatPercent") or 0.0),
                "fatMassKg": float(parsed.get("fatMassKg") or 0.0),
                "leanMassKg": float(parsed.get("leanMassKg") or 0.0),
                "visceralFatMassKg": visceral,
                "boneMassKg": bone,
                "trunkFatKg": trunk_fat,
                "trunkLeanMassKg": trunk_lean,
                "androidFatPercent": android_fat,
                "gynoidFatPercent": gynoid_fat,
                "scanDate": scan_date,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
