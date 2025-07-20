export interface ScheduleConfigInput {
  daysOfWeek: number[];       // [1,3,5]
  timeStart: string;          // "08:00"
  timeEnd: string;            // "10:00"
  validFrom?: Date;
  validTo?: Date;
}

export type ScheduleConfigSingleInput = Omit<
  ScheduleConfigInput,
  "daysOfWeek"
> & { dayOfWeek: number };

export type ScheduleConfigUpdateInput = Partial<{
  dayOfWeek: number;
  timeStart: string;
  timeEnd: string;
  validFrom: Date;
  validTo: Date;
}>;