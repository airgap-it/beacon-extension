import { Network, TezosOperation } from '@airgap/beacon-sdk'
import { TezosCryptoClient, TezosProtocol } from '@airgap/coinlib-core'
import * as bs58check from '@airgap/coinlib-core/dependencies/src/bs58check-2.1.2'
import { TezosWrappedOperation } from '@airgap/coinlib-core/protocols/tezos/types/TezosWrappedOperation'
import { RawTezosTransaction } from '@airgap/coinlib-core/serializer/types'
import Axios, { AxiosError, AxiosResponse } from 'axios'

import { bridge } from './extension-client/ledger-bridge'
import { Logger } from './extension-client/Logger'
import { OperationProvider, Signer } from './extension-client/Signer'
import { getProtocolForNetwork, getRpcUrlForNetwork } from './extension-client/utils'

const logger: Logger = new Logger('AirGap Signer')

export interface FullOperationGroup extends TezosWrappedOperation {
  chain_id: string
}

// tslint:disable:max-classes-per-file

export class AirGapOperationProvider implements OperationProvider {
  public async prepareOperations(
    operations: Partial<TezosOperation>[],
    network: Network,
    publicKey: string
  ): Promise<TezosWrappedOperation> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    return protocol.prepareOperations(publicKey, operations as any, false) // don't override parameters // TODO: Fix type
  }

  public async forgeWrappedOperation(wrappedOperation: TezosWrappedOperation, network: Network): Promise<string> {
    const protocol: TezosProtocol = await getProtocolForNetwork(network)

    const forgedTx: RawTezosTransaction = await protocol.forgeAndWrapOperations(wrappedOperation)

    return forgedTx.binaryTransaction
  }

  public async operationGroupFromWrappedOperation(
    tezosWrappedOperation: TezosWrappedOperation,
    network: Network
  ): Promise<FullOperationGroup> {
    const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)
    const { data: block }: AxiosResponse<{ chain_id: string }> = await Axios.get(`${rpcUrl}/chains/main/blocks/head`)
    const { data: branch } = await Axios.get(`${rpcUrl}/chains/main/blocks/head/hash`)
    return { chain_id: block.chain_id, ...tezosWrappedOperation, branch: branch }
  }

  public async broadcast(network: Network, signedTx: string): Promise<string> {
    const { rpcUrl }: { rpcUrl: string; apiUrl: string } = await getRpcUrlForNetwork(network)

    try {
      const { data: injectionResponse }: { data: string } = await Axios.post(
        `${rpcUrl}/injection/operation?chain=main`,
        JSON.stringify(signedTx),
        {
          headers: { 'content-type': 'application/json' }
        }
      )

      // returns hash if successful
      return injectionResponse
    } catch (err) {
      const axiosResponse: AxiosResponse = (err as AxiosError).response as AxiosResponse
      if (axiosResponse.status === 404) {
        throw {
          name: 'Node Unreachable',
          message: 'The node is not reachable, please try again later or make sure the URL is correct.',
          stack: axiosResponse.data
        }
      } else if (axiosResponse.status === 500) {
        throw {
          name: 'Node Error',
          message: 'The operation could not be processed by the node.',
          stack: axiosResponse.data
        }
      } else {
        throw { name: 'Node Error', message: 'Unknown error', stack: axiosResponse.data }
      }
    }
  }
}

export class LocalSigner implements Signer {
  public async sign(forgedTx: string, mnemonic: string): Promise<string> {
    const protocol: TezosProtocol = new TezosProtocol()
    const privatekey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    return protocol.signWithPrivateKey(privatekey, { binaryTransaction: forgedTx })
  }

  public async signMessage(message: string, mnemonic: string): Promise<string> {
    logger.log('Signing Message:', message)

    const protocol: TezosProtocol = new TezosProtocol()
    const privateKey: Buffer = await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    return protocol.signMessage(message, { privateKey })
  }
}

export class LedgerSigner implements Signer {
  public async sign(forgedTx: string, derivationPath: string): Promise<string> {
    const signature: string = await bridge.signOperation(forgedTx, derivationPath)

    return forgedTx + signature
  }

  public async signMessage(message: string): Promise<string> {
    logger.log('Signing Message:', message)

    const tezosCryptoClient = new TezosCryptoClient()

    const bufferMessage: Buffer = await tezosCryptoClient.toBuffer(message)
    const hash: Uint8Array = await tezosCryptoClient.hash(bufferMessage)

    const rawSignature: string = await bridge.signHash(Buffer.from(hash).toString('hex'))

    const edsigPrefix: Uint8Array = tezosCryptoClient.edsigPrefix

    const edSignature: string = bs58check.encode(
      Buffer.concat([Buffer.from(edsigPrefix), Buffer.from(rawSignature, 'hex')])
    )

    return edSignature
  }
}
