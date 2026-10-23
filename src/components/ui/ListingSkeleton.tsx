/** Rota geçişinde genel iskelet (gerçek içerik akışla gelir). */
export function ListingSkeleton() {
  return (
    <div className="shell pt-6 pb-16" aria-busy="true" aria-label="Yükleniyor">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton mt-6 h-12 w-2/3 max-w-xl rounded-md" />
      <div className="skeleton mt-4 h-5 w-1/2 max-w-md rounded" />
      <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5] rounded-md" />
            <div className="skeleton mt-4 h-4 w-3/4 rounded" />
            <div className="skeleton mt-2 h-4 w-1/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
