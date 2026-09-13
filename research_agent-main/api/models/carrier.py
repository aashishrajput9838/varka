from pydantic import BaseModel, ConfigDict


class CarrierBase(BaseModel):
    name: str
    scac_code: str


class CarrierCreate(CarrierBase):
    pass


class CarrierResponse(CarrierBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
