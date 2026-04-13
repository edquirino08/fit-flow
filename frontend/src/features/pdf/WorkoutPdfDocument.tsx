import {
  computePhaseLoads,
  type SheetExercise,
  type WorkoutSheet,
} from "@fit-flow/domain";
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
  brand: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  brandSub: { fontSize: 7, color: "#64748b", marginTop: 2 },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  groupHead: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#64748b", marginBottom: 16 },
  muscleTag: { fontSize: 7, color: "#64748b", marginBottom: 2 },
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

function groupKey(ex: SheetExercise): string {
  return ex.muscleGroup ?? "Outros";
}

export function WorkoutPdfDocument({ sheet }: { sheet: WorkoutSheet }) {
  const exported = sheet.exportedAt ?? new Date().toISOString();
  const dateStr = new Date(exported).toLocaleString("pt-BR");

  const sorted = [...sheet.exercises].sort((a, b) => {
    const ga = groupKey(a);
    const gb = groupKey(b);
    if (ga !== gb) return ga.localeCompare(gb, "pt-BR");
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>FIT FLOW</Text>
            <Text style={styles.brandSub}>Ficha de treino</Text>
          </View>
        </View>
        <Text style={styles.title}>{sheet.title}</Text>
        <Text style={styles.subtitle}>
          {sheet.subtitle ? `${sheet.subtitle} · ` : ""}
          Gerado em {dateStr}
        </Text>
        {sorted.map((ex, idx) => {
          const loads = computePhaseLoads(ex.finalLoadKg, ex.phases);
          const g = groupKey(ex);
          const prevG = idx > 0 ? groupKey(sorted[idx - 1]) : null;
          const showGroup = g !== prevG;
          return (
            <View key={ex.id} wrap={false}>
              {showGroup ? (
                <Text style={styles.groupHead}>{g}</Text>
              ) : null}
              <View style={styles.card} wrap={false}>
              <Text style={styles.exerciseTitle}>{ex.name}</Text>
              {ex.muscleGroup ? (
                <Text style={styles.muscleTag}>{ex.muscleGroup}</Text>
              ) : null}
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
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
