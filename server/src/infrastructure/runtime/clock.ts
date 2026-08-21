export interface Clock {
  now(): Date;
}
export const systemClock: Clock = {
  /** Returns the current wall-clock time. */ now: () => new Date(),
};
