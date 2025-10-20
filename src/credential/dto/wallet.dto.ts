import { ApiProperty } from "@nestjs/swagger";

export class WalletDto {
    @ApiProperty()
    walletId: string;
}
