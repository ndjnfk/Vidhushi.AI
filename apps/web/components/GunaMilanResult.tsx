import type { GunaMilanOut } from "@/lib/api";

export default function GunaMilanResult({ result }: { result: GunaMilanOut }) {
  const percent = Math.round((result.total_points / result.max_points) * 100);

  return (
    <div className="border rounded p-4 flex flex-col gap-3 max-w-md">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Guna Milan (Ashtakoot)</h3>
        <span className="text-2xl font-bold text-orange-600">
          {result.total_points} / {result.max_points}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
        <div className="bg-orange-600 h-2" style={{ width: `${percent}%` }} />
      </div>
      <table className="w-full text-sm">
        <tbody>
          {result.kootas.map((k) => (
            <tr key={k.name} className="border-t">
              <td className="py-1">{k.name}</td>
              <td className="py-1 text-gray-500">{k.note}</td>
              <td className="py-1 text-right font-medium">
                {k.points} / {k.max_points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
