export interface Insight {
  tag: "warning" | "success" | "danger" | "info";
  text: string;
}

export const generateInsight = ({
  spend,
  revenue,
  roi,
  conversionRate,
  budget,
  clicks,
}: {
  spend: number;
  revenue: number;
  roi: number | string;
  conversionRate: number | string;
  budget: number;
  clicks: number;
}): Insight => {
  const numRoi = typeof roi === "string" ? 0 : roi;
  const numCR = typeof conversionRate === "string" ? 0 : conversionRate;

  if (spend > budget * 0.8 && numCR < 1)
    return { tag: "warning", text: "High spend but very low conversions — review targeting" };
  if (numRoi > 150)
    return { tag: "success", text: "Strong ROI — consider scaling this campaign" };
  if (numRoi < 0)
    return { tag: "danger", text: "Negative ROI — campaign is actively losing money" };
  if (numCR < 0.5)
    return { tag: "warning", text: "Low engagement — review ad creative or audience" };
  if (spend < budget * 0.3)
    return { tag: "info", text: "Low spend utilisation — campaign may be underdelivering" };
  return { tag: "info", text: "Campaign performing within expected range" };
};
