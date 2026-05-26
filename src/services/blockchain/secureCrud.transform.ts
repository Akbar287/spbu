import { decryptString, encryptString, isCipherCompatibleWithMode } from './secureCrud.crypto';
import { getFunctionRule, SECURE_CRUD_CONFIG, shouldApplySecurity } from './secureCrud.config';

interface AbiParamLike {
    type?: string;
    name?: string;
    components?: AbiParamLike[];
}

interface AbiFunctionLike {
    type?: string;
    name?: string;
    stateMutability?: string;
    inputs?: AbiParamLike[];
    outputs?: AbiParamLike[];
}

interface ContractCallLike {
    abi?: readonly unknown[];
    functionName?: string;
    args?: readonly unknown[];
}

function findFunctionAbi(abi: readonly unknown[] | undefined, functionName: string | undefined): AbiFunctionLike | undefined {
    if (!abi || !functionName) return undefined;

    return (abi as AbiFunctionLike[]).find((item) => item?.type === 'function' && item?.name === functionName);
}

function getArrayInnerType(type: string): string {
    return type.replace(/\[[0-9]*\]$/, '');
}

function isArrayType(type: string): boolean {
    return /\[[0-9]*\]$/.test(type);
}

function isReadOnlyFunction(fnAbi: AbiFunctionLike | undefined): boolean {
    return fnAbi?.stateMutability === 'view' || fnAbi?.stateMutability === 'pure';
}

function transformByType(
    value: unknown,
    param: AbiParamLike | undefined,
    mode: 'encrypt' | 'decrypt',
    functionName: string | undefined,
): unknown {
    if (value === null || value === undefined) return value;
    if (!param?.type) return value;

    const { type } = param;

    if (type === 'string') {
        if (typeof value !== 'string') return value;
        return mode === 'encrypt' ? encryptString(value, functionName) : decryptString(value, functionName);
    }

    if (type === 'tuple') {
        if (Array.isArray(value)) {
            const tupleValues = [...value];
            const mappedArray = tupleValues.map((entry, index) =>
                transformByType(entry, param.components?.[index], mode, functionName),
            );

            // Preserve named tuple keys that viem can attach on array-like returns.
            for (let index = 0; index < (param.components?.length || 0); index++) {
                const component = param.components?.[index];
                if (!component?.name) continue;
                if (component.name in (value as any)) {
                    (mappedArray as any)[component.name] = transformByType(
                        (value as any)[component.name],
                        component,
                        mode,
                        functionName,
                    );
                }
            }

            return mappedArray;
        }

        if (typeof value === 'object') {
            const result: Record<string, unknown> = { ...(value as Record<string, unknown>) };
            for (let index = 0; index < (param.components?.length || 0); index++) {
                const component = param.components?.[index];
                if (!component) continue;

                if (component.name && component.name in result) {
                    result[component.name] = transformByType(result[component.name], component, mode, functionName);
                }

                const key = String(index);
                if (key in result) {
                    result[key] = transformByType(result[key], component, mode, functionName);
                }
            }
            return result;
        }

        return value;
    }

    if (isArrayType(type) && Array.isArray(value)) {
        const innerType = getArrayInnerType(type);
        const innerParam: AbiParamLike = {
            ...param,
            type: innerType,
        };
        return value.map((entry) => transformByType(entry, innerParam, mode, functionName));
    }

    return value;
}

function shouldEncryptArgAtIndex(
    functionName: string | undefined,
    argIndex: number,
    argParam: AbiParamLike | undefined,
): boolean {
    const rule = getFunctionRule(functionName);

    if (Array.isArray(rule.encryptArgs)) {
        return rule.encryptArgs.includes(argIndex);
    }

    if (rule.encryptArgs !== 'auto') return false;

    const type = argParam?.type || '';
    return type === 'string' || type === 'tuple' || isArrayType(type);
}

function findFirstIncompatibleCipherPath(
    value: unknown,
    param: AbiParamLike | undefined,
    path: string,
): string | null {
    if (value === null || value === undefined || !param?.type) return null;

    if (param.type === 'string') {
        if (typeof value !== 'string' || value.length === 0) return null;
        return isCipherCompatibleWithMode(value) ? null : path;
    }

    if (param.type === 'tuple') {
        if (Array.isArray(value)) {
            for (let index = 0; index < value.length; index++) {
                const nestedPath = findFirstIncompatibleCipherPath(
                    value[index],
                    param.components?.[index],
                    `${path}[${index}]`,
                );
                if (nestedPath) return nestedPath;
            }
            return null;
        }

        if (typeof value === 'object' && value !== null) {
            for (let index = 0; index < (param.components?.length || 0); index++) {
                const component = param.components?.[index];
                if (!component) continue;

                if (component.name && component.name in (value as Record<string, unknown>)) {
                    const nestedPath = findFirstIncompatibleCipherPath(
                        (value as Record<string, unknown>)[component.name],
                        component,
                        `${path}.${component.name}`,
                    );
                    if (nestedPath) return nestedPath;
                }

                const indexKey = String(index);
                if (indexKey in (value as Record<string, unknown>)) {
                    const nestedPath = findFirstIncompatibleCipherPath(
                        (value as Record<string, unknown>)[indexKey],
                        component,
                        `${path}[${index}]`,
                    );
                    if (nestedPath) return nestedPath;
                }
            }
            return null;
        }
    }

    if (isArrayType(param.type) && Array.isArray(value)) {
        const innerParam: AbiParamLike = { ...param, type: getArrayInnerType(param.type) };
        for (let index = 0; index < value.length; index++) {
            const nestedPath = findFirstIncompatibleCipherPath(value[index], innerParam, `${path}[${index}]`);
            if (nestedPath) return nestedPath;
        }
    }

    return null;
}

export function encryptContractArgs<T extends ContractCallLike>(parameters: T): T {
    if (!shouldApplySecurity(parameters.functionName)) return parameters;
    if (!parameters.args || !parameters.functionName) return parameters;

    const fnAbi = findFunctionAbi(parameters.abi, parameters.functionName);
    const rule = getFunctionRule(parameters.functionName);
    if (isReadOnlyFunction(fnAbi) && !rule.encryptReadArgs) {
        return parameters;
    }

    const inputs = fnAbi?.inputs || [];

    const nextArgs = parameters.args.map((arg, index) => {
        const inputParam = inputs[index];
        if (!shouldEncryptArgAtIndex(parameters.functionName, index, inputParam)) {
            return arg;
        }
        return transformByType(arg, inputParam, 'encrypt', parameters.functionName);
    });

    if (SECURE_CRUD_CONFIG.strictWriteValidation && !isReadOnlyFunction(fnAbi)) {
        for (let index = 0; index < nextArgs.length; index++) {
            const inputParam = inputs[index];
            if (!shouldEncryptArgAtIndex(parameters.functionName, index, inputParam)) continue;

            const incompatiblePath = findFirstIncompatibleCipherPath(nextArgs[index], inputParam, `args[${index}]`);
            if (incompatiblePath) {
                throw new Error(
                    `[secure-crud] Write payload belum terenkripsi (${parameters.functionName} -> ${incompatiblePath}).`
                );
            }
        }
    }

    return {
        ...parameters,
        args: nextArgs,
    };
}

export function decryptContractResult<T>(call: ContractCallLike, result: T): T {
    if (!shouldApplySecurity(call.functionName)) return result;
    if (!call.functionName) return result;

    const rule = getFunctionRule(call.functionName);
    if (!rule.decryptResult) return result;

    const fnAbi = findFunctionAbi(call.abi, call.functionName);
    const outputs = fnAbi?.outputs || [];

    if (!outputs.length) return result;

    if (outputs.length === 1) {
        return transformByType(result, outputs[0], 'decrypt', call.functionName) as T;
    }

    if (Array.isArray(result)) {
        const mapped = result.map((item, index) =>
            transformByType(item, outputs[index], 'decrypt', call.functionName),
        );
        return mapped as T;
    }

    if (typeof result === 'object' && result !== null) {
        const mapped: Record<string, unknown> = { ...(result as Record<string, unknown>) };
        outputs.forEach((output, index) => {
            if (output.name && output.name in mapped) {
                mapped[output.name] = transformByType(mapped[output.name], output, 'decrypt', call.functionName);
            }
            const key = String(index);
            if (key in mapped) {
                mapped[key] = transformByType(mapped[key], output, 'decrypt', call.functionName);
            }
        });
        return mapped as T;
    }

    return result;
}
