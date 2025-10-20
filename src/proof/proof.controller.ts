import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProofService } from './proof.service';

@ApiTags('Proofs')
@Controller('api/proof')
export class ProofController {
  constructor(private readonly proofService: ProofService) {}

  @Get(':walletId/presentation-exchange')
  @ApiOperation({ summary: 'List presentation exchange records' })
  @ApiResponse({ status: 200, description: 'Presentation exchange records retrieved successfully' })
  async getPresentationExchangeRecords(
    @Param('walletId') walletId: string,
    @Query('state') state?: string,
    @Query('connection_id') connectionId?: string
  ) {
    return this.proofService.getPresentationExchangeRecords(walletId, state, connectionId);
  }

  @Get(':walletId/presentation-exchange/:presExId')
  @ApiOperation({ summary: 'Get presentation exchange record details' })
  @ApiResponse({ status: 200, description: 'Presentation exchange record details retrieved successfully' })
  async getPresentationExchangeRecord(
    @Param('walletId') walletId: string,
    @Param('presExId') presExId: string
  ) {
    return this.proofService.getPresentationExchangeRecord(walletId, presExId);
  }

  @Get(':walletId/presentation-exchange/:presExId/credentials')
  @ApiOperation({ summary: 'Get matching credentials for presentation request' })
  @ApiResponse({ status: 200, description: 'Matching credentials retrieved successfully' })
  async getCredentialsForPresentationRequest(
    @Param('walletId') walletId: string,
    @Param('presExId') presExId: string
  ) {
    return this.proofService.getCredentialsForPresentationRequest(walletId, presExId);
  }

  @Post(':walletId/presentation-exchange/:presExId/send-presentation')
  @ApiOperation({ summary: 'Send presentation in response to proof request' })
  @ApiResponse({ status: 200, description: 'Presentation sent successfully' })
  async sendPresentation(
    @Param('walletId') walletId: string,
    @Param('presExId') presExId: string,
    @Body() presentationSpec: any
  ) {
    return this.proofService.sendPresentation(walletId, presExId, presentationSpec);
  }

  @Post(':walletId/send-presentation-request')
  @ApiOperation({ summary: 'Send presentation request to a connection' })
  @ApiResponse({ status: 200, description: 'Presentation request sent successfully' })
  async sendPresentationRequest(
    @Param('walletId') walletId: string,
    @Body('connection_id') connectionId: string,
    @Body('presentation_request') presentationRequest: any
  ) {
    return this.proofService.sendPresentationRequest(walletId, connectionId, presentationRequest);
  }

  @Post(':walletId/presentation-exchange/:presExId/verify-presentation')
  @ApiOperation({ summary: 'Verify received presentation' })
  @ApiResponse({ status: 200, description: 'Presentation verified successfully' })
  async verifyPresentation(
    @Param('walletId') walletId: string,
    @Param('presExId') presExId: string
  ) {
    return this.proofService.verifyPresentation(walletId, presExId);
  }

  @Post(':walletId/presentation-exchange/:presExId/problem-report')
  @ApiOperation({ summary: 'Send problem report for presentation exchange' })
  @ApiResponse({ status: 200, description: 'Problem report sent successfully' })
  async sendProblemReport(
    @Param('walletId') walletId: string,
    @Param('presExId') presExId: string,
    @Body('description') description: string
  ) {
    return this.proofService.sendProblemReport(walletId, presExId, description);
  }
}