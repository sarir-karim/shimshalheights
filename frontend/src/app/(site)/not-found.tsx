import { NotFoundContent } from "@/components/layout/NotFoundContent";

/** Used when a page inside the site calls notFound() (e.g. an unknown room): the site layout supplies the header and footer. */
export default function SiteNotFound() {
  return <NotFoundContent />;
}
