"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { connectMetaMask, connectKeplr, fetchKeplrBalances } from "../utils/walletUtils"
import { ValidatorList } from "./ValidatorList"

type WalletInfo = {
  address: string
  type: "MetaMask" | "Keplr"
  name?: string
  availableAmount?: string
  stakedAmount?: string
  claimableReward?: string
  portfolioValue?: string
  exchangeRates?: {
    usd: number
    eur: number
  }
  validatorInfo?: Array<{
    validatorAddress: string
    validatorName: string
    stakedAmount: string
    claimableReward: string
  }>
} | null

export default function WalletConnector() {
  const [walletInfo, setWalletInfo] = useState<WalletInfo>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalances() {
      if (walletInfo?.type === "Keplr" && walletInfo.address) {
        setIsBalanceLoading(true)
        try {
          const balances = await fetchKeplrBalances(walletInfo.address)
          setWalletInfo((prev) => (prev ? ({ ...prev, ...balances } as WalletInfo) : null))
        } catch (error) {
          console.error("Failed to fetch balances:", error)
          setError("Failed to fetch wallet balances. Please try again.")
        } finally {
          setIsBalanceLoading(false)
        }
      }
    }

    if (walletInfo?.type === "Keplr") {
      fetchBalances()
    }
  }, [walletInfo?.address])

  const handleConnectWallet = async (walletType: "MetaMask" | "Keplr") => {
    setIsLoading(true)
    setError(null)
    try {
      const info = walletType === "MetaMask" ? await connectMetaMask() : await connectKeplr()
      setWalletInfo(info as WalletInfo)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      console.error("Connection error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = () => {
    setWalletInfo(null)
    setError(null)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency }).format(amount)
  }

  return (
    <Card className="w-[800px]">
      <CardHeader>
        <CardTitle>Crypto Wallet Connector</CardTitle>
        <CardDescription>Connect to MetaMask or Keplr</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Connecting to wallet...</p>
          </div>
        ) : walletInfo ? (
          <div className="space-y-4">
            <div>
              <p>
                <strong>Connected to:</strong> {walletInfo.type}
              </p>
              {walletInfo.name && (
                <p>
                  <strong>Name:</strong> {walletInfo.name}
                </p>
              )}
              <p>
                <strong>Address:</strong> {walletInfo.address}
              </p>
            </div>
            {walletInfo.type === "Keplr" &&
              (isBalanceLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <p>Fetching balances...</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h3 className="font-semibold mb-2">Exchange Rates</h3>
                    <p>1 ATOM = {formatCurrency(walletInfo.exchangeRates?.usd || 0, "USD")}</p>
                    <p>1 ATOM = {formatCurrency(walletInfo.exchangeRates?.eur || 0, "EUR")}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Wallet Balances</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div></div>
                      <div className="font-medium">ATOM</div>
                      <div className="font-medium">EUR</div>
                      <div className="font-medium">USD</div>
                      <div>Available:</div>
                      <div>{walletInfo.availableAmount}</div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.availableAmount || "0") * (walletInfo.exchangeRates?.eur || 0),
                          "EUR",
                        )}
                      </div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.availableAmount || "0") * (walletInfo.exchangeRates?.usd || 0),
                          "USD",
                        )}
                      </div>
                      <div>Staked:</div>
                      <div>{walletInfo.stakedAmount}</div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.stakedAmount || "0") * (walletInfo.exchangeRates?.eur || 0),
                          "EUR",
                        )}
                      </div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.stakedAmount || "0") * (walletInfo.exchangeRates?.usd || 0),
                          "USD",
                        )}
                      </div>
                      <div>Claimable:</div>
                      <div>{walletInfo.claimableReward}</div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.claimableReward || "0") * (walletInfo.exchangeRates?.eur || 0),
                          "EUR",
                        )}
                      </div>
                      <div>
                        {formatCurrency(
                          Number.parseFloat(walletInfo.claimableReward || "0") * (walletInfo.exchangeRates?.usd || 0),
                          "USD",
                        )}
                      </div>
                      <div className="font-semibold">Total:</div>
                      <div className="font-semibold">{walletInfo.portfolioValue}</div>
                      <div className="font-semibold">
                        {formatCurrency(
                          Number.parseFloat(walletInfo.portfolioValue || "0") * (walletInfo.exchangeRates?.eur || 0),
                          "EUR",
                        )}
                      </div>
                      <div className="font-semibold">
                        {formatCurrency(
                          Number.parseFloat(walletInfo.portfolioValue || "0") * (walletInfo.exchangeRates?.usd || 0),
                          "USD",
                        )}
                      </div>
                    </div>
                  </div>
                  {walletInfo.validatorInfo && walletInfo.validatorInfo.length > 0 && (
                    <ValidatorList
                      validators={walletInfo.validatorInfo}
                      exchangeRates={walletInfo.exchangeRates || { usd: 0, eur: 0 }}
                    />
                  )}
                </>
              ))}
          </div>
        ) : (
          <p>Not connected to any wallet</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!walletInfo ? (
          <>
            <Button
              onClick={() => handleConnectWallet("MetaMask")}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Connect MetaMask</span>
            </Button>
            <Button
              onClick={() => handleConnectWallet("Keplr")}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Connect Keplr</span>
            </Button>
          </>
        ) : (
          <Button onClick={handleDisconnect}>Disconnect</Button>
        )}
      </CardFooter>
    </Card>
  )
}

