import { createSmartAccountClient } from 'permissionless'
import { createPimlicoClient } from 'permissionless/clients/pimlico'
import { toSimpleSmartAccount } from 'permissionless/accounts'
import { createPublicClient, http, Address } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'


// EntryPoint v0.7 address
const ENTRYPOINT_ADDRESS_V07 = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as const

const PIMLICO_API_KEY = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
if (!PIMLICO_API_KEY) {
    throw new Error('Pimlico API key is not set');
}

export function createPublicClientForAA() {
    return createPublicClient({
        chain: sepolia,
        transport: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
    })
}

export function createBundlerClient() {
    const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
    if (!pimlicoApiKey) {
        throw new Error('Pimlico API key is not set');
    }
    return createPimlicoClient({
        transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoApiKey}`),
        entryPoint: { address: ENTRYPOINT_ADDRESS_V07, version: '0.7' },
    })
}

export function createPaymasterClient() {
    const pimlicoApiKey = process.env.NEXT_PUBLIC_PIMLICO_API_KEY;

    if (!pimlicoApiKey) {
        throw new Error('Pimlico API key is not set');
    }
    return createPimlicoClient({
        transport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${pimlicoApiKey}`),
        entryPoint: { address: ENTRYPOINT_ADDRESS_V07, version: '0.7' },
    })
}

export async function getSignerFromWeb3Auth(web3AuthProvider: any) {
  try {
    // Correct method name for Web3Auth
    const privateKeyHex = await web3AuthProvider.request({
      method: 'private_key' // NOT 'eth_private_key'
    })
    
    // Web3Auth returns private key as hex string (might or might not have 0x prefix)
    const privateKeyWithPrefix = privateKeyHex.startsWith('0x') 
      ? privateKeyHex 
      : `0x${privateKeyHex}`
    
    // Convert to viem account
    const account = privateKeyToAccount(privateKeyWithPrefix as `0x${string}`)
    
    console.log('✅ Signer created:', account.address)
    
    return account
  } catch (error: any) {
    console.error('❌ Failed to get signer from Web3Auth:', error)
    throw new Error(`Failed to create signer: ${error.message}`)
  }
}

export async function createSmartAccount(signer: any) {
  try {
    const publicClient = createPublicClientForAA()
    const bundlerClient = createBundlerClient()
    const paymasterClient = createPaymasterClient()
    
    console.log('🔧 Creating SimpleAccount with EntryPoint v0.7...')
    
    // Create SimpleAccount
    const simpleAccount = await toSimpleSmartAccount({
      client: publicClient,
      owner: signer,
      entryPoint: { address: ENTRYPOINT_ADDRESS_V07 as `0x${string}`, version: '0.7' },
    })
    
    console.log('✅ SimpleAccount created')
    console.log('   Address:', simpleAccount.address)
    
    // Create smart account client with NEW API
    const smartAccountClient = createSmartAccountClient({
      account: simpleAccount,
      chain: sepolia,
      bundlerTransport: http(`https://api.pimlico.io/v2/sepolia/rpc?apikey=${PIMLICO_API_KEY}`),
      
      // NEW: paymaster property instead of middleware.sponsorUserOperation
      paymaster: paymasterClient,
      
      // NEW: userOperation property instead of middleware.gasPrice
      userOperation: {
        estimateFeesPerGas: async () => {
          console.log('⛽ Getting gas prices...')
          const gasPrice = await bundlerClient.getUserOperationGasPrice()
          console.log('✅ Gas prices obtained')
          return gasPrice.fast
        },
      },
    })
    
    console.log('🎉 Smart Account Client ready!')
    
    return {
      smartAccountClient,
      smartAccountAddress: simpleAccount.address,
    }
  } catch (error: any) {
    console.error('❌ Failed to create smart account:', error.message)
    throw error
  }
}

