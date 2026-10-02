import { ClipLoader } from "react-spinners";

const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
  success: "btn-success",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "",
  lg: "px-6 py-3 text-base rounded-xl",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${variants[variant] || variants.primary} ${sizes[size] || ""} ${className}`}
      {...props}
    >
      {loading && <ClipLoader size={14} color="currentColor" />}
      {children}
    </button>
  );
}
