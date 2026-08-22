/** Formats one instant as a local ISO calendar date in the requested IANA zone. */
export function localIsoDate(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
/** Adds whole calendar days to an ISO date without depending on the host timezone. */
function addIsoDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return shifted.toISOString().slice(0, 10);
}
/** Generates exactly thirty distinct oldest-first local ISO dates. */
export function lastThirtyLocalDates(
  timeZone: string,
  now = new Date(),
): string[] {
  const today = localIsoDate(now, timeZone);
  return Array.from({ length: 30 }, (_value, index) =>
    addIsoDays(today, index - 29),
  );
}
/** Converts local midnight to its UTC instant using iterative zone projection. */
export function utcStartOfLocalDate(value: string, timeZone: string): Date {
  const [year, month, day] = value.split("-").map(Number) as [
    number,
    number,
    number,
  ];
  const target = Date.UTC(year, month - 1, day);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const values = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    ) as Record<string, number>;
    const represented = Date.UTC(
      values.year ?? year,
      (values.month ?? month) - 1,
      values.day ?? day,
      values.hour ?? 0,
      values.minute ?? 0,
      values.second ?? 0,
    );
    guess += target - represented;
  }
  return new Date(guess);
}
/** Returns the inclusive label set and exclusive UTC range for the 30-day window. */
export function thirtyDayUtcRange(timeZone: string, now = new Date()) {
  const dates = lastThirtyLocalDates(timeZone, now);
  return {
    dates,
    start: utcStartOfLocalDate(dates[0]!, timeZone),
    end: utcStartOfLocalDate(addIsoDays(dates.at(-1)!, 1), timeZone),
  };
}
