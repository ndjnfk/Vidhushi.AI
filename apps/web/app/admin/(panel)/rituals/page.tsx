"use client";

import { AdminBookings } from "../bookings/page";

// Healing-ritual requests from the Rituals page: same flow as consultations.
export default function AdminRitualsPage() {
  return <AdminBookings kind="ritual" />;
}
