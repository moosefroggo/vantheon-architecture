type PercentageProps = {
  value: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
  className?: string;
};

export function Percentage({
  value,
  maximumFractionDigits = 1,
  showSign = false,
  className,
}: PercentageProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits,
    signDisplay: showSign ? "always" : "auto",
  }).format(value);

  return <span className={className}>{formatted}</span>;
}
