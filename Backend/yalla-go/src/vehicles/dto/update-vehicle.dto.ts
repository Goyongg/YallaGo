import { PartialType } from "@nestjs/mapped-types";
import { CreateDriverDto } from "src/users/dto/create-driver.dto";

export class UpdateVehicleDto extends PartialType(CreateDriverDto) {}