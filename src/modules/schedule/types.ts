export interface ScheduleConfigInput {
  timeStart: string; // "08:00"
  timeEnd: string; // "17:00"
  validFrom?: Date;
  validTo?: Date;
  dayIds: number[]; // [1, 2, 3] - IDs dos DayOfWeek
}

export type ScheduleConfigUpdateInput = Partial<{
  timeStart: string;
  timeEnd: string;
  validFrom: Date;
  validTo: Date;
  dayIds: number[];
}>;

export interface DayOfWeek {
  id: number;
  name: string; // "monday", "tuesday", etc.
}

export interface ScheduleConfig {
  id: number;
  timeStart: string;
  timeEnd: string;
  validFrom?: Date | null;
  validTo?: Date | null;
  days: DayOfWeek[];
}
