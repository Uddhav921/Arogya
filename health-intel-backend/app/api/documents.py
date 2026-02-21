import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import Patient, MedicalRecord
from app.services.document_extractor import extract_text, summarize_extracted_text

router = APIRouter(prefix="/patients", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}
MAX_FILE_SIZE_MB = 10


@router.post("/{patient_id}/upload-report")
async def upload_report(
    patient_id: int,
    file: UploadFile = File(..., description="Medical report in PDF or DOCX format"),
    record_type: str = Form(
        default="report",
        description="Type of record: report, lab_result, discharge_summary, prescription"
    ),
    title: Optional[str] = Form(
        default=None,
        description="Optional title for this report (e.g. 'Blood Test - Jan 2025')"
    ),
    db: Session = Depends(get_db),
):
    """
    Upload a medical report (PDF or DOCX) and extract its text content.

    The extracted text is saved as a MedicalRecord and returned for review.

    Supported formats:
    - .pdf  (standard medical reports, lab results, discharge summaries)
    - .docx (doctor notes, prescriptions, referral letters)
    - .doc  (legacy Word documents)

    The extracted text becomes part of the patient's longitudinal context
    and is used in future assessments and chatbot conversations.
    """
    # ── Validate patient exists ────────────────────────────────────────────────
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient {patient_id} not found")

    # ── Validate file type ─────────────────────────────────────────────────────
    filename = file.filename or "unknown.bin"
    from pathlib import Path
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{ext}'. "
                "Please upload a .pdf or .docx file."
            ),
        )

    # ── Read file content ──────────────────────────────────────────────────────
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB} MB."
        )

    # ── Extract text ───────────────────────────────────────────────────────────
    try:
        raw_text = extract_text(filename, content)
    except ValueError as e:
        raise HTTPException(status_code=415, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from '{filename}': {str(e)}"
        )

    if not raw_text or not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail=(
                "Could not extract any text from this file. "
                "The file may be scanned/image-based (OCR not supported). "
                "Please upload a text-based PDF."
            ),
        )

    # ── Summarize / truncate for storage ──────────────────────────────────────
    summary_text = summarize_extracted_text(raw_text, max_chars=3000)

    # ── Auto-generate title if not provided ───────────────────────────────────
    if not title:
        title = filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    # ── Save as MedicalRecord ──────────────────────────────────────────────────
    record = MedicalRecord(
        patient_id=patient_id,
        record_type=record_type,
        title=title,
        summary=summary_text,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return JSONResponse(
        status_code=201,
        content={
            "message": "Report uploaded and extracted successfully.",
            "record_id": record.id,
            "record_type": record_type,
            "title": title,
            "filename": filename,
            "file_size_kb": round(len(content) / 1024, 1),
            "extracted_chars": len(raw_text),
            "stored_chars": len(summary_text),
            "truncated": len(raw_text) > len(summary_text),
            # Return first 500 chars so the caller can spot-check extraction
            "preview": raw_text[:500].strip() + ("..." if len(raw_text) > 500 else ""),
        },
    )
