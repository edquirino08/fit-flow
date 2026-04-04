import { computePhaseLoads, type WorkoutSheet } from "@fit-flow/domain";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  exerciseTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  row: { flexDirection: "row", marginBottom: 2 },
  cell: { flex: 1, fontSize: 8, color: "#334155" },
  cellHead: { flex: 1, fontSize: 7, color: "#94a3b8", textTransform: "uppercase" },
  chip: {
    fontSize: 7,
    backgroundColor: "#ffe8e5",
    color: "#c2410c",
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 3,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
});

function fmtKg(n: number | null): string {
  if (n == null) return "—";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
}

export function WorkoutPdfDocument({ sheet }: { sheet: WorkoutSheet }) {
  const exported = sheet.exportedAt ?? new Date().toISOString();
  const dateStr = new Date(exported).toLocaleString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{sheet.title}</Text>
        <Text style={styles.subtitle}>
          {sheet.subtitle ? `${sheet.subtitle} · ` : ""}
          Gerado em {dateStr}
        </Text>
        {sheet.exercises.map((ex) => {
          const loads = computePhaseLoads(ex.finalLoadKg, ex.phases);
          return (
            <View key={ex.id} style={styles.card} wrap={false}>
              <Text style={styles.exerciseTitle}>{ex.name}</Text>
              {ex.techniques.length > 0 ? (
                <View style={styles.chipRow}>
                  {ex.techniques.map((t) => (
                    <Text key={t} style={styles.chip}>
                      {t}
                    </Text>
                  ))}
                </View>
              ) : null}
              <View style={[styles.row, { marginTop: 6 }]}>
                {loads.map((l) => (
                  <Text key={l.id} style={styles.cellHead}>
                    {l.label}
                  </Text>
                ))}
              </View>
              <View style={styles.row}>
                {loads.map((l) => (
                  <Text key={l.id} style={styles.cell}>
                    {l.enabled ? fmtKg(l.kg) : "—"}
                  </Text>
                ))}
              </View>
              <Text style={{ marginTop: 4, fontSize: 7, color: "#94a3b8" }}>
                Repetições
              </Text>
              <View style={styles.row}>
                {loads.map((l) => (
                  <Text key={`${l.id}-reps`} style={styles.cell}>
                    {l.enabled ? l.reps : "—"}
                  </Text>
                ))}
              </View>
              <Text style={{ marginTop: 4, fontSize: 7, color: "#94a3b8" }}>
                Séries
              </Text>
              <View style={styles.row}>
                {loads.map((l) => (
                  <Text key={`${l.id}-sets`} style={styles.cell}>
                    {l.enabled ? `${l.sets}x` : "—"}
                  </Text>
                ))}
              </View>
              {ex.notes ? (
                <Text style={{ marginTop: 4, fontSize: 8, color: "#64748b" }}>
                  {ex.notes}
                </Text>
              ) : null}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
