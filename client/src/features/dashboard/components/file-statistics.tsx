import type { FileStatistics as FileStatisticsData } from "@gold-era/contracts/public";
/** Displays accessible current totals, quota, normalized distribution, and 30-day history. */
export function FileStatistics({ data }: { data: FileStatisticsData }) {
  const used = Number(data.storedBytes);
  const limit = Number(data.quota.limitBytes);
  const percent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <section aria-label="File activity">
      <h2>File activity</h2>
      <p>
        {data.fileCount} files · {data.storedBytes} bytes stored
      </p>
      <label>
        Storage quota{" "}
        <progress value={used} max={limit}>
          {percent}%
        </progress>{" "}
        {data.quota.remainingBytes} of {data.quota.limitBytes} bytes remaining
      </label>
      <h3>Types</h3>
      {data.fileCount === 0 ? (
        <p>No stored file types yet.</p>
      ) : (
        <ul>
          {data.typeDistribution.map((item) => (
            <li key={item.type}>
              {item.type}: {item.count}
            </li>
          ))}
        </ul>
      )}
      <h3>Last 30 days</h3>
      <table>
        <caption>Uploads by local date in {data.timeZone}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Uploads</th>
          </tr>
        </thead>
        <tbody>
          {data.uploadHistory.map((item) => (
            <tr key={item.date}>
              <th scope="row">{item.date}</th>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
