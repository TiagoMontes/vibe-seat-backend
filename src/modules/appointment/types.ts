// Input para criação de appointment
export interface AppointmentInput {
	chairId: number;
	datetimeStart: string; // ISO string, ex: "2025-07-25T08:00:00.000Z"
}
  
export interface AppointmentStatusInput {
	status: "CANCELLED" | "CONFIRMED";
}