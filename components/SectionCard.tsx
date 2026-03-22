import { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export default function SectionCard({ title, children }: Props) {
  return (
    <section className="rounded-[1.5rem] border border-slate-800 bg-slate-900/80 p-5 shadow-sm shadow-slate-950/20">
      <h2 className="mb-4 text-base font-semibold text-white">{title}</h2>
      <div className="text-sm leading-7 text-slate-200">{children}</div>
    </section>
  );
}
