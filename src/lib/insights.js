export function generateInsight({ spend, revenue, roi, conversionRate, budget }) {
  if (spend > budget * 0.8 && conversionRate < 1)
    return { tag: "warning", text: "High spend but very low conversions — review targeting" };
  if (roi > 150) return { tag: "success", text: "Strong ROI — consider scaling this campaign" };
  if (roi < 0) return { tag: "danger", text: "Negative ROI — campaign is actively losing money" };
  if (conversionRate < 0.5) return { tag: "warning", text: "Low engagement — review ad creative or audience" };
  if (spend < budget * 0.3) return { tag: "info", text: "Low spend utilisation — campaign may be underdelivering" };
  return { tag: "info", text: "Campaign performing within expected range" };
}
