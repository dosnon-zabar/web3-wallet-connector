import * as React from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

type ValidatorInfo = {
  validatorAddress: string
  validatorName: string
  stakedAmount: string
  claimableReward: string
}

type ValidatorListProps = {
  validators: ValidatorInfo[]
  exchangeRates: {
    usd: number
    eur: number
  }
}

export function ValidatorList({ validators, exchangeRates }: ValidatorListProps) {
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency }).format(amount)
  }

  const toggleExpand = (validatorAddress: string) => {
    setExpandedValidator(expandedValidator === validatorAddress ? null : validatorAddress)
  }

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Validator Information</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Validator</TableHead>
            <TableHead>Staked ATOM</TableHead>
            <TableHead>Claimable Rewards</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validators.map((validator) => (
            <React.Fragment key={validator.validatorAddress}>
              <TableRow>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{validator.validatorName}</div>
                    <div className="text-sm text-muted-foreground">{validator.validatorAddress.slice(0, 12)}...</div>
                  </div>
                </TableCell>
                <TableCell>{validator.stakedAmount}</TableCell>
                <TableCell>{validator.claimableReward}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => toggleExpand(validator.validatorAddress)}>
                    {expandedValidator === validator.validatorAddress ? "Hide" : "Show"} Details
                  </Button>
                </TableCell>
              </TableRow>
              {expandedValidator === validator.validatorAddress && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="p-4 bg-muted/50 rounded-md space-y-2">
                      <p>
                        <strong>Validator Address:</strong> {validator.validatorAddress}
                      </p>
                      <p>
                        <strong>Staked:</strong>{" "}
                        {formatCurrency(Number.parseFloat(validator.stakedAmount) * exchangeRates.eur, "EUR")} /{" "}
                        {formatCurrency(Number.parseFloat(validator.stakedAmount) * exchangeRates.usd, "USD")}
                      </p>
                      <p>
                        <strong>Claimable:</strong>{" "}
                        {formatCurrency(Number.parseFloat(validator.claimableReward) * exchangeRates.eur, "EUR")} /{" "}
                        {formatCurrency(Number.parseFloat(validator.claimableReward) * exchangeRates.usd, "USD")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

