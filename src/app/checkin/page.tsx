import { redirect } from "next/navigation";

export default function CheckinRootRedirect() {
  // If someone accesses `/checkin` without an event ID, redirect them
  // to a demo event for the sake of the delivery showcase.
  // In a real app, this would redirect to an event selector or dashboard.
  redirect("/checkin/evt_demo_123");
}
