import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "../icons";
import TextField from "./TextField";

export default function PasswordField(props) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField {...props} type={isVisible ? "text" : "password"}>
      <button
        type="button"
        className="field__toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
      >
        {isVisible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </TextField>
  );
}
