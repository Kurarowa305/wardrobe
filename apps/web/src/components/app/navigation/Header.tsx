import type { ReactNode } from "react";

type HeaderProps = {
  title: string;
  left?: ReactNode;
  right?: ReactNode;
};

const Header = ({ title, left, right }: HeaderProps) => (
  <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
    <div className="min-w-[48px] justify-self-start">{left}</div>
    <div className="text-center text-base font-semibold text-slate-900">
      {title}
    </div>
    <div className="min-w-[48px] justify-self-end">{right}</div>
  </div>
);

export default Header;
