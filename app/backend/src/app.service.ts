import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { message: string; version: string } {
    return {
      message: 'Welcome to ChainCred API - Blockchain-based Credential Verification Platform',
      version: '1.0.0',
    };
  }

  getHealth(): {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getVersion(): {
    version: string;
    apiPrefix: string;
    nodeVersion: string;
  } {
    return {
      version: '1.0.0',
      apiPrefix: process.env.API_PREFIX || 'api/v1',
      nodeVersion: process.version,
    };
  }
}
