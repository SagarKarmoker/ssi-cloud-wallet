import { Body, Controller, Post, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionService } from './connection.service';
import { AcceptInviteDto } from './dto/acceptInvite.dto';

@ApiTags('Connections')
@Controller('api/connection')
export class ConnectionController {
    constructor(private readonly connectionService: ConnectionService) {}

    @Post('accept-invitation')
    @ApiOperation({ summary: 'Accept a connection invitation' })
    @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
    acceptInvitation(@Body() body: AcceptInviteDto) {
        return this.connectionService.acceptInvitation(body.walletId, body.invitation);
    }

    @Post(':walletId/create-invitation')
    @ApiOperation({ summary: 'Create a connection invitation' })
    @ApiResponse({ status: 200, description: 'Invitation created successfully' })
    createInvitation(@Param('walletId') walletId: string) {
        return this.connectionService.createInvitation(walletId);
    }

    @Get(':walletId/connections')
    @ApiOperation({ summary: 'List all connections for a wallet' })
    @ApiResponse({ status: 200, description: 'Connections retrieved successfully' })
    getConnections(
        @Param('walletId') walletId: string,
        @Query('state') state?: string
    ) {
        return this.connectionService.getConnections(walletId, state);
    }

    @Get(':walletId/connections/:connectionId')
    @ApiOperation({ summary: 'Get connection details' })
    @ApiResponse({ status: 200, description: 'Connection details retrieved successfully' })
    getConnection(
        @Param('walletId') walletId: string,
        @Param('connectionId') connectionId: string
    ) {
        return this.connectionService.getConnection(walletId, connectionId);
    }

    @Post(':walletId/connections/:connectionId/send-message')
    @ApiOperation({ summary: 'Send a basic message to a connection' })
    @ApiResponse({ status: 200, description: 'Message sent successfully' })
    sendMessage(
        @Param('walletId') walletId: string,
        @Param('connectionId') connectionId: string,
        @Body('content') content: string
    ) {
        return this.connectionService.sendMessage(walletId, connectionId, content);
    }
}
