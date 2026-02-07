import type { ReactNode } from "react";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

const Screen = ({ children, scroll = true }: ScreenProps) => (
  <div className={scroll ? "h-full overflow-y-auto" : "h-full"}>
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      {children}
    </div>
  </div>
);

export default Screen;
