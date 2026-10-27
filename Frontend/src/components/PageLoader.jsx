import Spinner from "./ui/Spinner";

export default function PageLoader({ label = "Loading your account" }) {
  return (
    <div className="page-loader">
      <Spinner size="lg" label={label} />
    </div>
  );
}
