import { Cloud } from '@rotcare/cloud';
import { apiGateway } from './apiGateway';
import { startObjectStorage } from './startObjectStorage';

export async function startCloud(): Promise<Cloud> {
    return {
        objectStorage: await startObjectStorage(),
        serverless: apiGateway,
        apiGateway,
    };
}
