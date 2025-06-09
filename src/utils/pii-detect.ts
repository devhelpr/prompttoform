import nlp from "compromise";

export interface PiiEntity {
  type: string;
  match: string;
  index: number;
  valid?: boolean;
}

export function detectPIIWithBSN(text: string): PiiEntity[] {
  const doc = nlp(text);
  const pii: PiiEntity[] = [];

  const addMatches = (matches: string[], type: string) => {
    for (const m of matches) {
      pii.push({ type, match: m, index: text.indexOf(m) });
    }
  };

  addMatches(doc.people().out("array"), "person");
  addMatches(doc.places().out("array"), "place");
  addMatches(doc.organizations().out("array"), "organization");
  addMatches(doc.phoneNumbers().out("array"), "phone");
  addMatches(doc.emails().out("array"), "email");

  // Add BSN detection via regex
  const bsnRegex = /\b\d{9}\b/g;
  let match: RegExpExecArray | null;
  while ((match = bsnRegex.exec(text)) !== null) {
    const bsn = match[0];
    const isValid = bsn.length === 9 && validateBSN(bsn);
    if (isValid) {
      pii.push({
        type: "bsn",
        match: bsn,
        index: match.index,
        valid: isValid,
      });
    }
  }

  return pii;
}

// 🧮 Optional: 11-proof check for Dutch BSN
function validateBSN(bsn: string): boolean {
  if (!/^\d{9}$/.test(bsn)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const digit = parseInt(bsn[i], 10);
    const weight = i === 8 ? -1 : 9 - i;
    sum += digit * weight;
  }
  return sum % 11 === 0;
}
