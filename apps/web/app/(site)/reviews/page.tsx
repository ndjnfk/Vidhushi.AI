import ReviewsView from "@/components/reviews/ReviewsView";
import { REVIEWS_PAGE, type ReviewPageOut } from "@/lib/reviews";
import { fetchPublic } from "@/lib/seo";

// Server-rendered so search engines read the first page of reviews; "Show
// more" still loads further pages in the browser.
export default async function ReviewsPage() {
  const first = await fetchPublic<ReviewPageOut>(`/reviews?skip=0&limit=${REVIEWS_PAGE}`, 60);
  return <ReviewsView initial={first} />;
}
