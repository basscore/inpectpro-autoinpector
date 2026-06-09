// Sistem penilaian berbasis grade huruf (A+ s/d D).
//
// Di belakang layar skor tetap disimpan sebagai angka 0–100 di kolom
// `overall_score` (tabel inspection_results) supaya data lama tetap kompatibel
// dan tidak perlu migrasi database. Helper di bawah ini menjembatani antara
// angka dan grade huruf yang ditampilkan ke pengguna.

export type Grade = "A+" | "A" | "B+" | "B" | "C+" | "C" | "D";

// Urut dari terbaik ke terburuk. `score` adalah angka kanonik yang disimpan
// saat sebuah grade dipilih; `min` adalah ambang bawah untuk mengubah angka
// (termasuk data lama) menjadi grade.
export const GRADES: { grade: Grade; score: number; min: number }[] = [
  { grade: "A+", score: 95, min: 90 },
  { grade: "A", score: 85, min: 80 },
  { grade: "B+", score: 75, min: 70 },
  { grade: "B", score: 65, min: 60 },
  { grade: "C+", score: 55, min: 50 },
  { grade: "C", score: 45, min: 40 },
  { grade: "D", score: 30, min: 0 },
];

// Angka -> grade huruf (dipakai untuk menampilkan & memetakan data lama).
export function scoreToGrade(score: number): Grade {
  const found = GRADES.find((g) => score >= g.min);
  return found ? found.grade : "D";
}

// Grade huruf -> angka kanonik untuk disimpan.
export function gradeToScore(grade: Grade): number {
  const found = GRADES.find((g) => g.grade === grade);
  return found ? found.score : 30;
}

// Label deskriptif & warna berdasarkan angka (dipakai di laporan cetak).
export function gradeLabel(score: number): string {
  if (score >= 80) return "Kondisi Prima";
  if (score >= 60) return "Kondisi Baik";
  if (score >= 40) return "Perlu Perhatian";
  return "Perlu Perbaikan";
}

export function gradeTone(score: number): string {
  if (score >= 60) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}
