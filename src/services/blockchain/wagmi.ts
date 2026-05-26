import {
    useReadContract as baseUseReadContract,
    useReadContracts as baseUseReadContracts,
    useWriteContract as baseUseWriteContract,
} from 'wagmi';
import { decryptContractResult, encryptContractArgs } from './secureCrud.transform';

export * from 'wagmi';

function decryptReadContractsData(
    contracts: ReadonlyArray<Record<string, unknown>> | undefined,
    data: unknown,
): unknown {
    if (!Array.isArray(data) || !Array.isArray(contracts)) return data;

    return data.map((entry, index) => {
        const contract = contracts[index] as any;
        if (!contract) return entry;

        // allowFailure=true shape: { status: 'success' | 'failure', result?: unknown, error?: unknown }
        if (entry && typeof entry === 'object' && 'status' in (entry as any)) {
            const settled = entry as any;
            if (settled.status !== 'success') return entry;
            return {
                ...settled,
                result: decryptContractResult(contract, settled.result),
            };
        }

        // allowFailure=false shape: direct result array
        return decryptContractResult(contract, entry);
    });
}

export const useReadContract: typeof baseUseReadContract = ((parameters?: any) => {
    const securedParams = parameters ? encryptContractArgs(parameters) : parameters;
    const result = baseUseReadContract(securedParams as any);

    return {
        ...result,
        data: decryptContractResult(securedParams as any, (result as any).data),
    } as any;
}) as typeof baseUseReadContract;

export const useReadContracts: typeof baseUseReadContracts = ((parameters?: any) => {
    const securedParams = parameters
        ? {
              ...parameters,
              contracts: Array.isArray(parameters.contracts)
                  ? parameters.contracts.map((contract: any) => encryptContractArgs(contract))
                  : parameters.contracts,
          }
        : parameters;

    const result = baseUseReadContracts(securedParams as any);
    const decrypted = decryptReadContractsData(securedParams?.contracts, (result as any).data);

    return {
        ...result,
        data: decrypted,
    } as any;
}) as typeof baseUseReadContracts;

export const useWriteContract: typeof baseUseWriteContract = ((parameters?: any) => {
    const result = baseUseWriteContract(parameters as any) as any;

    const writeContract = (variables: any, options?: any) =>
        result.writeContract(encryptContractArgs(variables), options);

    const writeContractAsync = (variables: any, options?: any) =>
        result.writeContractAsync(encryptContractArgs(variables), options);

    return {
        ...result,
        writeContract,
        writeContractAsync,
    };
}) as typeof baseUseWriteContract;
