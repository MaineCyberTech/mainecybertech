import {
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatDateTimeMinutesUtc,
  formatDateTimeUtc,
  formatDateUtc,
  formatMonthDay,
  formatMonthDayYear,
  formatTime,
} from "@/lib/format";

const ISO = "2026-09-27T15:04:05.000Z";

describe("formatDate", () => {
  it("formats strings and Date objects as UTC dates", () => {
    expect(formatDate(ISO)).toBe("2026-09-27");
    expect(formatDate(new Date(ISO))).toBe("2026-09-27");
  });

  it("returns an em dash for missing or invalid values", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
  });
});

describe("UTC-pinned helpers", () => {
  it("formatDateUtc pins the en-US locale and UTC", () => {
    expect(formatDateUtc(ISO)).toBe("9/27/2026");
    expect(formatDateUtc(null)).toBe("—");
  });

  it("formatDateTimeUtc includes the UTC time", () => {
    const value = formatDateTimeUtc(ISO);
    expect(value).toContain("9/27/2026");
    expect(value).toContain("3:04:05 PM");
  });

  it("formatDateTimeMinutesUtc uses a space separator", () => {
    expect(formatDateTimeMinutesUtc(ISO)).toBe("2026-09-27 15:04");
    expect(formatDateTimeMinutesUtc(null)).toBe("—");
  });
});

describe("locale helpers", () => {
  it("formatDateShort matches the en-US date format", () => {
    const expected = new Date(ISO).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    expect(formatDateShort(ISO)).toBe(expected);
    expect(formatDateShort("nope")).toBe("—");
  });

  it("formatDateTime matches the en-US date-time format", () => {
    const expected = new Date(ISO).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(formatDateTime(ISO)).toBe(expected);
  });

  it("formatTime matches the en-US time format", () => {
    const expected = new Date(ISO).toLocaleTimeString("en-US");
    expect(formatTime(ISO)).toBe(expected);
    expect(formatTime(null)).toBe("—");
  });

  it("formatMonthDay / formatMonthDayYear format correctly", () => {
    expect(formatMonthDay(ISO)).toBe(
      new Date(ISO).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    );
    expect(formatMonthDayYear(ISO)).toBe(
      new Date(ISO).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "2-digit",
      }),
    );
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("supports other currencies", () => {
    expect(formatCurrency(1234.5, "EUR")).toContain("1,234.50");
  });

  it("returns an em dash for non-finite values", () => {
    expect(formatCurrency(Number.NaN)).toBe("—");
    expect(formatCurrency(undefined as unknown as number)).toBe("—");
  });
});
