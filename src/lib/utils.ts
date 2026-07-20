import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEventStatus(dateStr: string, timeStr: string): 'upcoming' | 'ongoing' | 'past' | 'unknown' {
  try {
    if (!dateStr || !timeStr) return 'unknown';
    
    // Parse date: "18/07/2026" -> day: 18, month: 6 (0-indexed), year: 2026
    const dateParts = dateStr.split('/');
    if (dateParts.length !== 3) return 'unknown';
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const year = parseInt(dateParts[2], 10);

    // Parse time: "19:00 - 20:00" -> start: "19:00", end: "20:00"
    const timeParts = timeStr.split('-');
    if (timeParts.length !== 2) return 'unknown';
    
    const startTimeParts = timeParts[0].trim().split(':');
    const endTimeParts = timeParts[1].trim().split(':');
    
    if (startTimeParts.length !== 2 || endTimeParts.length !== 2) return 'unknown';

    const startHour = parseInt(startTimeParts[0], 10);
    const startMin = parseInt(startTimeParts[1], 10);
    
    const endHour = parseInt(endTimeParts[0], 10);
    const endMin = parseInt(endTimeParts[1], 10);

    const startTime = new Date(year, month, day, startHour, startMin);
    const endTime = new Date(year, month, day, endHour, endMin);
    
    const now = new Date();

    if (now < startTime) {
      return 'upcoming';
    } else if (now > endTime) {
      return 'past';
    } else {
      return 'ongoing';
    }
  } catch (error) {
    return 'unknown';
  }
}
