import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pageMainContainer">
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link href="/">Go Home</Link>
    </div>
  );
}
