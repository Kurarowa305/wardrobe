import Link from "next/link";

type BackButtonProps = {
  href: string;
  label: string;
};

export function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link href={href} className="nav-back-button">
      {label}
    </Link>
  );
}
