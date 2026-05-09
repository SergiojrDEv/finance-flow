const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function money(value) {
  return formatter.format(value || 0);
}

export function buildCashflowChartView(months) {
  const last = months.at(-1) || { free: 0 };

  return {
    status: last.free >= 0 ? "Saldo positivo" : "Saldo negativo",
    config: {
      type: "line",
      data: {
        labels: months.map((item) => item.label),
        datasets: [
          {
            label: "Receitas",
            data: months.map((item) => item.income),
            borderColor: "#168a5b",
            backgroundColor: "rgba(22,138,91,.08)",
            tension: 0.35,
            fill: true,
          },
          {
            label: "Despesas",
            data: months.map((item) => item.expense),
            borderColor: "#c43d4b",
            backgroundColor: "rgba(196,61,75,.08)",
            tension: 0.35,
            fill: true,
          },
          {
            label: "Saldo livre",
            data: months.map((item) => item.free),
            borderColor: "#0b7285",
            tension: 0.35,
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { usePointStyle: true } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${money(ctx.parsed.y)}` } },
        },
        scales: {
          y: { ticks: { callback: (value) => money(value).replace(",00", "") } },
        },
      },
    },
  };
}
