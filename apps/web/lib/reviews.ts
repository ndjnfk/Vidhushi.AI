import { apiFetch } from "@/lib/api";

export type ReviewKind = "consultation" | "ritual" | "order";

export interface ReviewOut {
  id: string;
  target_kind: ReviewKind;
  rating: number; // 1-5
  text: string;
  name: string; // shortened, e.g. "Asha V."
  label: string; // what was reviewed
  created_at: string; // UTC, no offset
}

export interface MyReviewOut extends ReviewOut {
  target_id: string;
}

export interface ReviewPageOut {
  items: ReviewOut[];
  total: number;
  average: number | null;
}

export const REVIEWS_PAGE = 10;

export const listReviews = (skip = 0, limit = REVIEWS_PAGE) =>
  apiFetch<ReviewPageOut>(`/reviews?skip=${skip}&limit=${limit}`);
export const myReviews = () => apiFetch<MyReviewOut[]>("/reviews/mine");
// target: "booking" for a consultation/ritual, "order" for a shop order.
export const createReview = (body: { target: "booking" | "order"; target_id: string; rating: number; text: string }) =>
  apiFetch<ReviewOut>("/reviews", { method: "POST", body: JSON.stringify(body) });
