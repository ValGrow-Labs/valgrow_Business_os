import { useMemo, useCallback } from "react";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import {
  formatMoney as formatMoneyUtil,
  formatCompactMoney as formatCompactMoneyUtil,
  getCurrencySymbol,
  FormatMoneyOptions,
} from "@/lib/currencies";

export function useActiveCurrency() {
  const { data: userMe, isLoading } = useCurrentUser();
  const activeOrganization = userMe?.activeOrganization;

  const currencyCode = activeOrganization?.currency;
  const isCurrencyLoading = isLoading && !activeOrganization;

  const currencySymbol = useMemo(() => {
    if (isCurrencyLoading) return "…";
    if (!currencyCode) return "---";
    return getCurrencySymbol(currencyCode);
  }, [currencyCode, isCurrencyLoading]);

  const formatMoney = useCallback(
    (
      amount: number | string | null | undefined,
      currencyOrOptions?: string | FormatMoneyOptions,
      options?: FormatMoneyOptions,
    ) => {
      if (typeof currencyOrOptions === "string") {
        return formatMoneyUtil(amount, currencyOrOptions, options);
      }
      return formatMoneyUtil(amount, currencyCode, currencyOrOptions);
    },
    [currencyCode],
  );

  const formatCompact = useCallback(
    (amount: number | string | null | undefined, overrideCurrencyCode?: string) => {
      return formatCompactMoneyUtil(amount, overrideCurrencyCode || currencyCode);
    },
    [currencyCode],
  );

  return {
    currencyCode,
    currencySymbol,
    isCurrencyLoading,
    formatMoney,
    formatCompact,
    activeOrganization,
  };
}
