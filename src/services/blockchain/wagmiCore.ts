import {
    readContract as coreReadContract,
    simulateContract as coreSimulateContract,
    writeContract as coreWriteContract,
} from '@wagmi/core';
import { decryptContractResult, encryptContractArgs } from './secureCrud.transform';

export * from '@wagmi/core';

export const readContract: typeof coreReadContract = (async (config, parameters) => {
    const securedParams = encryptContractArgs(parameters as any);
    const result = await coreReadContract(config as any, securedParams as any);
    return decryptContractResult(securedParams as any, result as any);
}) as typeof coreReadContract;

export const simulateContract: typeof coreSimulateContract = (async (config, parameters) => {
    const securedParams = encryptContractArgs(parameters as any);
    const simulation = await coreSimulateContract(config as any, securedParams as any);

    if (simulation && typeof simulation === 'object' && 'result' in simulation) {
        return {
            ...simulation,
            result: decryptContractResult(securedParams as any, (simulation as any).result),
        } as any;
    }

    return simulation;
}) as typeof coreSimulateContract;

export const writeContract: typeof coreWriteContract = (async (config, parameters) => {
    const securedParams = encryptContractArgs(parameters as any);
    return coreWriteContract(config as any, securedParams as any);
}) as typeof coreWriteContract;
