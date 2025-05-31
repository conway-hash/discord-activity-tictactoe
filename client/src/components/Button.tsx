function Button({
  className = '',
  disabled = false,
  content,
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  content: string;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      className={`p-1 bg-yellow rounded-md disabled:cursor-not-allowed text-black text-lg ${className}`}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export default Button;
