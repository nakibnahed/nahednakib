/** Postgres undefined_table (relation does not exist). */
export function isMissingTable(err) {
  if (!err) return false;
  if (err.code === "42P01") return true;
  return /relation .+ does not exist/i.test(String(err.message || ""));
}

/** Postgres undefined_column */
export function isMissingColumn(err) {
  if (!err) return false;
  if (err.code === "42703") return true;
  return /column .* does not exist/i.test(String(err.message || ""));
}
