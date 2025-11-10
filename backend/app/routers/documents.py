from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..models import Document
from ..services.document_service import DocumentService

router = APIRouter(prefix="/cases/{case_id}/documents", tags=["documents"])


def get_document_service() -> DocumentService:
    return DocumentService()


@router.get("/", response_model=list[Document])
def list_documents(case_id: str, service: DocumentService = Depends(get_document_service)):
    return service.list_documents(case_id)


@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
async def upload_document(
    case_id: str,
    file: UploadFile = File(...),
    service: DocumentService = Depends(get_document_service),
):
    file_bytes = await file.read()
    return service.store_document(
        case_id=case_id,
        file_name=file.filename,
        content_type=file.content_type,
        file_bytes=file_bytes,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    case_id: str,
    document_id: str,
    service: DocumentService = Depends(get_document_service),
):
    existing_docs = service.list_documents(case_id)
    if document_id not in {doc.id for doc in existing_docs}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found for case")
    service.delete_document(document_id)

