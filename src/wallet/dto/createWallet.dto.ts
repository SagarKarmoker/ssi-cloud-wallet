import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty()
  walletName: string;
  @ApiProperty()
  walletKey: string;
  @ApiProperty()
  walletLabel: string;
}
