export interface TimeRange {
  start: string; // "08:00"
  end: string; // "10:00"
}

export interface ScheduleConfigInput {
  timeRanges: TimeRange[]; // [{"start": "08:00", "end": "10:00"}, {"start": "14:00", "end": "16:00"}]
  validFrom?: Date;
  validTo?: Date;
  dayIds: number[]; // [1, 2, 3] - IDs dos DayOfWeek
}

export type ScheduleConfigUpdateInput = Partial<{
  timeRanges: TimeRange[];
  validFrom: Date;
  validTo: Date;
  dayIds: number[];
}>;

export interface DayOfWeek {
  id: number;
  name: string; // "monday", "tuesday", etc.
  scheduleConfigId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ScheduleConfig {
  id: number;
  timeRanges: TimeRange[];
  validFrom?: Date | null;
  validTo?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  days: DayOfWeek[];
}
