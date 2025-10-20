import { ApiProperty } from "@nestjs/swagger";

export class AcceptInviteDto {
    @ApiProperty()
    walletId: string;
    @ApiProperty()
    invitation: any;
}