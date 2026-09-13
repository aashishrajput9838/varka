from pydantic import BaseModel, ConfigDict


class PortBase(BaseModel):
    unlocode: str
    name: str
    country: str


class PortCreate(PortBase):
    pass


class PortResponse(PortBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
