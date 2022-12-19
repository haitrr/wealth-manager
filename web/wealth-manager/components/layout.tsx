interface Props {
  children: React.ReactNode;
}

export default function Layout({children}: Props) {
  return (
    <main className="bg-slate-900 h-screen text-white">
      <div className="max-w-7xl m-auto p-[20px]">{children}</div>
    </main>
  );
}
