from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..models import Case, CaseCreate, CaseUpdate
from ..services.case_service import CaseService

router = APIRouter(prefix="/cases", tags=["cases"])


def get_case_service() -> CaseService:
    return CaseService()


@router.get("/", response_model=list[Case])
def list_cases(user_id: str, service: CaseService = Depends(get_case_service)):
    return service.list_cases(user_id)


@router.post("/", response_model=Case, status_code=status.HTTP_201_CREATED)
def create_case(
    user_id: str,
    payload: CaseCreate,
    service: CaseService = Depends(get_case_service),
):
    return service.create_case(user_id, payload)


@router.get("/{case_id}", response_model=Case)
def get_case(case_id: str, service: CaseService = Depends(get_case_service)):
    case = service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=Case)
def update_case(
    case_id: str,
    payload: CaseUpdate,
    service: CaseService = Depends(get_case_service),
):
    case = service.update_case(case_id, payload)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(case_id: str, service: CaseService = Depends(get_case_service)):
    service.delete_case(case_id)

