from pydantic import BaseModel, ConfigDict


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    service: str
    version: str
