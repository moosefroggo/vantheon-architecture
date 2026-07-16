type TimestampProps = {
  value: Date | string | number;
  className?: string;
};

export function Timestamp({ value, className }: TimestampProps) {
  const date = value instanceof Date ? value : new Date(value);
  const dateTime = Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  const label = dateTime
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : "Unknown time";

  return (
    <time className={className} dateTime={dateTime}>
      {label}
    </time>
  );
}
