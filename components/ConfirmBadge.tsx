type Props = {
  isConfirmed: boolean;
};

export default function ConfirmBadge({ isConfirmed }: Props) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        isConfirmed
          ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-100"
          : "border-slate-700 bg-slate-950 text-slate-300"
      }`}
    >
      {isConfirmed ? "確認済み" : "未確認"}
    </span>
  );
}
