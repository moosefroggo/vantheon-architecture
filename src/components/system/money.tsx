type MoneyProps = {
  value: number;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
  className?: string;
};

export function Money({
  value,
  currency = "USD",
  minimumFractionDigits = 0,
  maximumFractionDigits = 0,
  showSign = false,
  className,
}: MoneyProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay: showSign ? "always" : "auto",
  }).format(value);

  return <span className={className}>{formatted}</span>;
}
