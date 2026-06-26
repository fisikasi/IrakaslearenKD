export type CurriculumStructure = Record<string, string[]>;

export const curriculum: Record<string, Record<string, CurriculumStructure>> = {
  "Fisika eta Kimika": {
    "3.DBH": {
      KE1: ["1.1", "1.2", "1.3"],
      KE2: ["2.1", "2.2", "2.3"],
      KE3: ["3.1", "3.2", "3.3"],
      KE4: ["4.1", "4.2"],
      KE5: ["5.1", "5.2"],
      KE6: ["6.1", "6.2"]
    },
    "4.DBH": {
      KE1: ["1.1", "1.2"],
      KE2: ["2.1", "2.2"],
      KE3: ["3.1", "3.2"],
      KE4: ["4.1", "4.2"],
      KE5: ["5.1", "5.2"],
      KE6: ["6.1", "6.2"]
    }
  }
};

export function getSubjects() {
  return Object.keys(curriculum);
}

export function getLevelsForSubject(subject: string) {
  return Object.keys(curriculum[subject] ?? {});
}

export function getCurriculumStructure(subject: string, level: string) {
  return curriculum[subject]?.[level] ?? null;
}