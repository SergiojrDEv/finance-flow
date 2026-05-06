const VALID_TYPES = new Set(["income", "expense", "investment"]);

function parseMonthKey(dateValue) {
  const [year, month] = String(dateValue || "").split("-");
  if (!year || !month) return "";
  return `${year}-${month}`;
}

export function normalizeTransactionType(type) {
  return VALID_TYPES.has(type) ? type : "expense";
}

export function buildMonthTransactionList({
  transactions = [],
  monthKey = "",
  typeFilter = "all",
  search = "",
} = {}) {
  const query = String(search || "").toLowerCase().trim();
  const safeTypeFilter = VALID_TYPES.has(typeFilter) ? typeFilter : "all";

  return (Array.isArray(transactions) ? transactions : [])
    .filter((item) => parseMonthKey(item?.date) === monthKey)
    .map((item) => ({
      ...item,
      type: normalizeTransactionType(item?.type || item?.transaction_kind || item?.kind),
      description: item?.description || "",
      category: item?.category || "",
      subcategory: item?.subcategory || "",
      account: item?.account || "",
      paymentMethod: item?.paymentMethod || "pix",
      date: item?.date || "",
      dueDate: item?.dueDate || "",
      status: item?.status || "paid",
      amount: Number(item?.amount || 0),
    }))
    .filter((item) => safeTypeFilter === "all" || item.type === safeTypeFilter)
    .filter((item) => {
      if (!query) return true;
      const haystack = `${item.description} ${item.category} ${item.subcategory} ${item.account} ${item.paymentMethod}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}
