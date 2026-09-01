import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeTaskTitle,
  normalizePertemuanNames,
  getPertemuanSetKey,
  getDistinctTaskTitles,
  getTasksByTitle,
  getPertemuanUnion,
  getSubmittedUserIdsForScope,
} from "@/features/task/validators/task.utils";
import { parseDateTimeLocalToWIB } from "@/lib/date-time";

test("normalizeTaskTitle trims and collapses internal whitespace", () => {
  assert.equal(normalizeTaskTitle("  Matematika   Diskrit  "), "Matematika Diskrit");
  assert.equal(normalizeTaskTitle("Basis Data"), "Basis Data");
  assert.equal(normalizeTaskTitle("   "), "");
});

test("normalizePertemuanNames trims, drops empty, and dedupes case-insensitively", () => {
  assert.deepEqual(
    normalizePertemuanNames([
      "  Pertemuan 1 ",
      "",
      " pertemuan 1 ",
      "Pertemuan 2",
      "PERTEMUAN 2",
    ]),
    ["Pertemuan 1", "Pertemuan 2"]
  );

  assert.deepEqual(normalizePertemuanNames(['', '   ']), []);
  assert.deepEqual(normalizePertemuanNames([]), []);
});

test("getPertemuanSetKey is a stable, case-insensitive key for a meeting set", () => {
  assert.equal(
    getPertemuanSetKey(["Pertemuan 2", "pertemuan 1"]),
    getPertemuanSetKey(["PERTEMUAN 1", "Pertemuan 2"])
  );

  assert.equal(
    getPertemuanSetKey(["  Pertemuan 1  ", "Pertemuan 1", "p e r t e m u a n 1"]),
    "p e r t e m u a n 1|pertemuan 1"
  );

  assert.notEqual(
    getPertemuanSetKey(["Pertemuan 1"]),
    getPertemuanSetKey(["Pertemuan 2"])
  );
  assert.notEqual(
    getPertemuanSetKey(["Pertemuan 1"]),
    getPertemuanSetKey(["Pertemuan 1", "Pertemuan 2"])
  );

  assert.equal(getPertemuanSetKey([]), "");
});

test("getDistinctTaskTitles collapses same-title rows into one dropdown entry", () => {
  const rows = [
    { title: "Tugas A" },
    { title: "Tugas A" },
    { title: "  tugas   a " }, 
    { title: "Tugas B" },
    { title: "Tugas B" },
  ];
  assert.deepEqual(getDistinctTaskTitles(rows), ["Tugas A", "Tugas B"]);
  assert.deepEqual(getDistinctTaskTitles([]), []);
});

test("getTasksByTitle returns every CMS row sharing the chosen title", () => {
  type Row = {
    id: string;
    title: string;
    pertemuan?: { id: string; name: string }[] | null;
  };
  const rows: Row[] = [
    { id: "t1", title: "Tugas A", pertemuan: [{ id: "p1", name: "Pertemuan 1" }] },
    { id: "t2", title: "tugas A", pertemuan: [{ id: "p2", name: "Pertemuan 2" }] },
    { id: "t3", title: "Tugas B" },
  ];

  assert.deepEqual(getTasksByTitle(rows, "Tugas A").map((t) => t.id), ["t1", "t2"]);
  assert.deepEqual(getTasksByTitle(rows, "Tugas B").map((t) => t.id), ["t3"]);
  assert.deepEqual(getTasksByTitle(rows, ""), []);
  assert.deepEqual(getTasksByTitle(rows, "Tidak Ada"), []);
});

test("getPertemuanUnion aggregates meetings from all task rows", () => {
  type Row = {
    id: string;
    title: string;
    pertemuan?: { id: string; name: string }[] | null;
  };
  const rows: Row[] = [
    { id: "t1", title: "Tugas A", pertemuan: [{ id: "p1", name: "Pertemuan 1" }] },
    { id: "t2", title: "Tugas A", pertemuan: [{ id: "p2", name: "Pertemuan 2" }] },
    { id: "t3", title: "Tugas A" },
  ];

  assert.deepEqual(getPertemuanUnion(rows), [
    { id: "p1", name: "Pertemuan 1" },
    { id: "p2", name: "Pertemuan 2" },
  ]);
  assert.deepEqual(getPertemuanUnion([]), []);
});

test("parseDateTimeLocalToWIB preserves the wall-clock time in Asia/Jakarta", () => {
  const value = parseDateTimeLocalToWIB("2026-09-01T00:00");
  assert.ok(value);
  assert.equal(value?.toISOString(), "2026-08-31T17:00:00.000Z");
  assert.equal(
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(value!),
    "00.00"
  );
});

test("getSubmittedUserIdsForScope syncs resumes per pertemuan (incl. legacy rows)", () => {
  const p1 = "p1";
  const p2 = "p2";
  type Row = {
    id: string;
    title: string;
    pertemuan?: { id: string; name: string }[] | null;
    submissions?: {
      userId: string;
      status?: string;
      pertemuanId?: string | null;
    }[] | null;
  };
  const rows: Row[] = [
    {
      id: "t1",
      title: "Tugas A",
      pertemuan: [{ id: p1, name: "Pertemuan 1" }],
      submissions: [
        { userId: "u1", status: "SUBMITTED", pertemuanId: p1 },
        { userId: "u2", status: "SUBMITTED", pertemuanId: p1 },
        { userId: "u3", status: "PENDING", pertemuanId: null },
      ],
    },
    {
      id: "t2",
      title: "Tugas A",
      pertemuan: [{ id: p2, name: "Pertemuan 2" }],
      submissions: [
        { userId: "u1", status: "SUBMITTED", pertemuanId: null },
        { userId: "u4", status: "SUBMITTED", pertemuanId: null },
      ],
    },
  ];

  assert.deepEqual(
    Array.from(getSubmittedUserIdsForScope(rows, "").values()).sort(),
    ["u1", "u2", "u4"]
  );

  assert.deepEqual(
    Array.from(getSubmittedUserIdsForScope(rows, p1).values()).sort(),
    ["u1", "u2"]
  );

  assert.deepEqual(
    Array.from(getSubmittedUserIdsForScope(rows, p2).values()).sort(),
    ["u1", "u4"]
  );
});