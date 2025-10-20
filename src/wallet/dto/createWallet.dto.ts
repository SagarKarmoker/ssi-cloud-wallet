import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletDto {
  @ApiProperty({ 
    description: 'Unique wallet name',
    example: 'alice_wallet_2024' 
  })
  walletName: string;

  @ApiProperty({ 
    description: 'Wallet encryption key (minimum 8 characters)',
    example: 'secure_key_123'
  })
  walletKey: string;

  @ApiProperty({ 
    description: 'Human-readable wallet label',
    example: 'Alice Personal Wallet' 
  })
  walletLabel: string;
}
