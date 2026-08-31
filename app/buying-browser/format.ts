import { CUSTOMER_FX_THB_PER_USD, customerUsdToThb, formatCustomerUsd } from "./domain.mjs";
import type { CustomerLanguage } from "./types";

export function formatThb(value: number | null | undefined) {
  return value === null || value === undefined ? "Pending" : `THB ${value.toLocaleString("en-US")}`;
}

export { CUSTOMER_FX_THB_PER_USD };

export function formatUsdFromThb(value: number | null | undefined) {
  return formatCustomerUsd(value);
}

export function formatCustomerPrimaryPrice(value: number | null | undefined, language: CustomerLanguage) {
  return language === "th" ? formatThb(value) : formatUsdFromThb(value);
}

export function formatCustomerSecondaryPrice(value: number | null | undefined, language: CustomerLanguage) {
  if (value === null || value === undefined) return "";
  return language === "th" ? `${formatUsdFromThb(value)} est.` : `${formatThb(value)} approx.`;
}

export function customerUsdInputToThb(value: string) {
  return customerUsdToThb(value);
}

export function customerFxDisclosure() {
  return `Preview FX: THB ${CUSTOMER_FX_THB_PER_USD.toFixed(2)} = USD 1. Final USD price is set when NK issues an approved quote.`;
}

export function formatMileage(value: number | null | undefined) {
  return value === null || value === undefined ? "Need Review" : `${value.toLocaleString("en-US")} km`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

export function customerInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NK";
}
