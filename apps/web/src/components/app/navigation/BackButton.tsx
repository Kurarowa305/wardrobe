import Link from "next/link";

type BackButtonProps = {
  href: string;
};

export function BackButton({ href }: BackButtonProps) {
  return (
    <Link href={href} className="nav-back-button">
      戻る
    </Link>
  );
}
