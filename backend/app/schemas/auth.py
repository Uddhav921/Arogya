"""Auth schemas for login/register."""

from typing import Optional
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    age: int
    sex: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    known_conditions: list[str] = []


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    patient_id: int
    username: str
    name: str
    message: str
