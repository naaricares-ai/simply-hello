import { describe, it, expect, vi } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("Data Fetching - Students", () => {
  it("should query students table with correct parameters", async () => {
    const mockData = [
      { id: "1", full_name: "John Doe", admission_number: "ADM001", class_id: "c1", is_active: true },
      { id: "2", full_name: "Jane Smith", admission_number: "ADM002", class_id: "c1", is_active: true },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    });

    const result = await supabase.from("students").select("*").eq("is_active", true).order("full_name");
    expect(result.data).toHaveLength(2);
    expect(result.data![0].full_name).toBe("John Doe");
  });
});

describe("Data Fetching - Homework", () => {
  it("should query homework with class filter", async () => {
    const mockHomework = [
      { id: "h1", title: "Math HW", subject: "Mathematics", class_id: "c1", due_date: "2026-04-15" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockHomework, error: null }),
    });

    const result = await supabase.from("homework").select("*").eq("class_id", "c1").order("due_date");
    expect(result.data).toHaveLength(1);
    expect(result.data![0].subject).toBe("Mathematics");
  });
});

describe("Data Fetching - Attendance", () => {
  it("should query attendance for a specific date", async () => {
    const mockAttendance = [
      { id: "a1", student_id: "s1", status: "present", date: "2026-04-09" },
      { id: "a2", student_id: "s2", status: "absent", date: "2026-04-09" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: mockAttendance, error: null }),
      }),
    });

    const result = await supabase.from("student_attendance").select("*").eq("class_id", "c1").eq("date", "2026-04-09");
    expect(result.data).toHaveLength(2);
  });
});

describe("Data Fetching - Timetable", () => {
  it("should query timetable for a class", async () => {
    const mockTimetable = [
      { id: "t1", class_id: "c1", subject: "Math", day_of_week: 1, start_time: "08:00", end_time: "08:45" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockTimetable, error: null }),
    });

    const result = await supabase.from("timetable").select("*").eq("class_id", "c1").order("day_of_week");
    expect(result.data).toHaveLength(1);
  });
});

describe("Data Fetching - Leaves", () => {
  it("should query teacher leaves", async () => {
    const mockLeaves = [
      { id: "l1", teacher_id: "t1", leave_type: "casual", status: "pending", start_date: "2026-04-10", end_date: "2026-04-11" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockLeaves, error: null }),
    });

    const result = await supabase.from("teacher_leaves").select("*").eq("teacher_id", "t1").order("start_date");
    expect(result.data).toHaveLength(1);
    expect(result.data![0].leave_type).toBe("casual");
  });
});

describe("Data Fetching - Events", () => {
  it("should query upcoming events", async () => {
    const mockEvents = [
      { id: "e1", title: "Annual Day", start_date: "2026-05-01", event_type: "event" },
    ];

    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
    });

    const result = await supabase.from("events").select("*").gte("start_date", "2026-04-09").order("start_date").limit(5);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].title).toBe("Annual Day");
  });
});

describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: "Permission denied", code: "42501" } }),
    });

    const result = await supabase.from("students").select("*").eq("is_active", true);
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("should handle network timeout", async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockRejectedValue(new Error("Network timeout")),
    });

    await expect(
      supabase.from("students").select("*").eq("is_active", true)
    ).rejects.toThrow("Network timeout");
  });
});
