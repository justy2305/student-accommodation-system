import { Link } from "react-router-dom";
import { HouseIcon } from "./icons";

export default function Logo() {
  return (
    <Link to="/" className="logo" aria-label="FindMyhome, go to home page">
      <HouseIcon size={26} strokeWidth={2.25} />
      <span className="logo__word">FindMyhome</span>
    </Link>
  );
}
