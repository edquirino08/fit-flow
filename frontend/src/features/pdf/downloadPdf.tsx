import type { WorkoutSheet } from "@fit-flow/domain";

export async function downloadWorkoutPdf(sheet: WorkoutSheet, filename: string) {
  const [{ pdf }, { WorkoutPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./WorkoutPdfDocument"),
  ]);
  const blob = await pdf(<WorkoutPdfDocument sheet={sheet} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
