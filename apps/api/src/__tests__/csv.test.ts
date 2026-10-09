import { escapeCsvValue, rowsToCsv } from "../lib/csv";

describe("CSV export safety [FILE-P2-006]", () => {
  it("prefixes formula-leading values so spreadsheets treat them as text", () => {
    expect(escapeCsvValue("=1+1")).toBe("'=1+1");
    expect(escapeCsvValue("+SUM(A1)")).toBe("'+SUM(A1)");
    expect(escapeCsvValue("-cmd|'/c calc'!A0")).toBe("'-cmd|'/c calc'!A0");
    expect(escapeCsvValue("@IMPORTXML(A1)")).toBe("'@IMPORTXML(A1)");
    expect(escapeCsvValue("\t=1+1")).toBe("'\t=1+1");
    expect(escapeCsvValue("\r=1+1")).toBe("'\r=1+1");
  });

  it("does not alter plain numbers (negative values are not formulas)", () => {
    expect(escapeCsvValue("-12.5")).toBe("-12.5");
    expect(escapeCsvValue("+3")).toBe("+3");
    expect(escapeCsvValue("42")).toBe("42");
  });

  it("still quotes values containing separators and quotes", () => {
    expect(escapeCsvValue("a,b")).toBe('"a,b"');
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue("line\nbreak")).toBe('"line\nbreak"');
    // A guarded formula that also contains a comma stays quoted.
    expect(escapeCsvValue("=CMD(a,b)")).toBe('"\'=CMD(a,b)"');
  });

  it("renders null/undefined as empty and objects as JSON", () => {
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(undefined)).toBe("");
    expect(escapeCsvValue({ a: 1 })).toBe('"{""a"":1}"');
  });

  it("applies the guard through rowsToCsv", () => {
    const csv = rowsToCsv([{ name: "=evil()", count: -3 }], [
      { key: "name" },
      { key: "count" },
    ]);
    expect(csv).toBe("name,count\n'=evil(),-3");
  });
});
