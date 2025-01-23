import { ethers } from "ethers"
import type { Window as KeplrWindow } from "@keplr-wallet/types"

declare global {
  interface Window extends KeplrWindow {}
}

export async function connectMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const address = await signer.getAddress()
      return { address, type: "MetaMask" }
    } catch (error) {
      console.error("Failed to connect to MetaMask:", error)
      throw new Error("Failed to connect to MetaMask. Please check if MetaMask is installed and unlocked.")
    }
  } else {
    throw new Error("MetaMask not detected. Please install MetaMask extension.")
  }
}

export async function connectKeplr() {
  if (typeof window.keplr === "undefined") {
    throw new Error("Keplr extension not detected. Please install Keplr extension.")
  }

  const chainId = "cosmoshub-4"

  try {
    await window.keplr.enable(chainId)
    const offlineSigner = window.keplr.getOfflineSigner(chainId)
    const accounts = await offlineSigner.getAccounts()

    if (accounts.length === 0) {
      throw new Error("No accounts found in Keplr wallet.")
    }

    const address = accounts[0].address
    const key = await window.keplr.getKey(chainId)

    return {
      address,
      type: "Keplr",
      name: key.name,
      pubKey: Buffer.from(key.pubKey).toString("base64"),
      isNanoLedger: key.isNanoLedger,
    }
  } catch (error) {
    console.error("Failed to connect to Keplr:", error)
    throw new Error("Failed to connect to Keplr. Please check if your wallet is unlocked and try again.")
  }
}

async function fetchExchangeRates() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=cosmos&vs_currencies=usd,eur")
    const data = await response.json()
    return {
      usd: data.cosmos.usd,
      eur: data.cosmos.eur,
    }
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error)
    return { usd: 0, eur: 0 }
  }
}

async function fetchValidatorInfo(address: string) {
  try {
    const rpcEndpoint = "https://rest.cosmos.directory/cosmoshub"

    // Fetch delegations
    const delegationsResponse = await fetch(`${rpcEndpoint}/cosmos/staking/v1beta1/delegations/${address}`)
    const delegationsData = await delegationsResponse.json()

    // Fetch rewards
    const rewardsResponse = await fetch(`${rpcEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`)
    const rewardsData = await rewardsResponse.json()

    // Fetch validator details for each validator
    const validatorDetailsPromises = delegationsData.delegation_responses.map(async (delegation: any) => {
      const validatorResponse = await fetch(
        `${rpcEndpoint}/cosmos/staking/v1beta1/validators/${delegation.delegation.validator_address}`,
      )
      return validatorResponse.json()
    })

    const validatorDetails = await Promise.all(validatorDetailsPromises)

    // Process and combine the data
    const validatorInfo = delegationsData.delegation_responses.map((delegation: any, index: number) => {
      const reward = rewardsData.rewards.find(
        (r: any) => r.validator_address === delegation.delegation.validator_address,
      )
      const rewardAmount = reward ? reward.reward.find((r: any) => r.denom === "uatom")?.amount : "0"
      const validatorName = validatorDetails[index]?.validator?.description?.moniker || "Unknown Validator"

      return {
        validatorAddress: delegation.delegation.validator_address,
        validatorName: validatorName,
        stakedAmount: (Number.parseFloat(delegation.balance.amount) / 1000000).toFixed(6),
        claimableReward: (Number.parseFloat(rewardAmount) / 1000000).toFixed(6),
      }
    })

    return validatorInfo
  } catch (error) {
    console.error("Failed to fetch validator info:", error)
    return []
  }
}

export async function fetchKeplrBalances(address: string) {
  try {
    const chainId = "cosmoshub-4"
    const rpcEndpoint = "https://rest.cosmos.directory/cosmoshub"

    // Fetch available balance
    const balanceResponse = await fetch(`${rpcEndpoint}/cosmos/bank/v1beta1/balances/${address}`)
    const balanceData = await balanceResponse.json()
    const atomBalance = balanceData.balances.find((coin: any) => coin.denom === "uatom")
    const availableAmount = atomBalance ? Number.parseFloat(atomBalance.amount) / 1000000 : 0

    // Fetch staked balance
    const stakedResponse = await fetch(`${rpcEndpoint}/cosmos/staking/v1beta1/delegations/${address}`)
    const stakedData = await stakedResponse.json()
    const stakedAmount = stakedData.delegation_responses.reduce((sum: number, delegation: any) => {
      return sum + Number.parseFloat(delegation.balance.amount) / 1000000
    }, 0)

    // Fetch claimable rewards
    const rewardsResponse = await fetch(`${rpcEndpoint}/cosmos/distribution/v1beta1/delegators/${address}/rewards`)
    const rewardsData = await rewardsResponse.json()
    const claimableReward = rewardsData.total.find((reward: any) => reward.denom === "uatom")
    const claimableAmount = claimableReward ? Number.parseFloat(claimableReward.amount) / 1000000 : 0

    // Fetch exchange rates
    const exchangeRates = await fetchExchangeRates()

    // Calculate total portfolio value
    const portfolioValue = availableAmount + stakedAmount + claimableAmount

    // Fetch validator information
    const validatorInfo = await fetchValidatorInfo(address)

    return {
      availableAmount: availableAmount.toFixed(6),
      stakedAmount: stakedAmount.toFixed(6),
      claimableReward: claimableAmount.toFixed(6),
      portfolioValue: portfolioValue.toFixed(6),
      exchangeRates: exchangeRates,
      validatorInfo: validatorInfo,
    }
  } catch (error) {
    console.error("Failed to fetch balances:", error)
    return {
      availableAmount: "0",
      stakedAmount: "0",
      claimableReward: "0",
      portfolioValue: "0",
      exchangeRates: { usd: 0, eur: 0 },
      validatorInfo: [],
    }
  }
}

