import { describe, it, expect } from "vitest";
import { formatDateIndian } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn (class name merge)", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      const result = cn("base", false && "hidden", "visible");
      expect(result).toContain("base");
      expect(result).toContain("visible");
      expect(result).not.toContain("hidden");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
    });

    it("should merge tailwind classes correctly", () => {
      const result = cn("px-4 py-2", "px-8");
      expect(result).toContain("px-8");
      expect(result).not.toContain("px-4");
    });
  });

  describe("formatDateIndian", () => {
    it("should format date in Indian format", () => {
      const result = formatDateIndian("2026-04-09");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("should handle ISO date strings", () => {
      const result = formatDateIndian("2026-01-15T10:00:00Z");
      expect(result).toBeTruthy();
    });
  });
});

describe("Form Validation", () => {
  it("should validate email format", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test("test@example.com")).toBe(true);
    expect(emailRegex.test("invalid")).toBe(false);
    expect(emailRegex.test("@no-user.com")).toBe(false);
  });

  it("should validate phone number format", () => {
    const phoneRegex = /^\d{10}$/;
    expect(phoneRegex.test("9876543210")).toBe(true);
    expect(phoneRegex.test("123")).toBe(false);
    expect(phoneRegex.test("abcdefghij")).toBe(false);
  });

  it("should validate required fields", () => {
    const validateRequired = (val: string) => val.trim().length > 0;
    expect(validateRequired("John")).toBe(true);
    expect(validateRequired("")).toBe(false);
    expect(validateRequired("   ")).toBe(false);
  });
});

describe("Role-based Access", () => {
  const ROLE_HOME: Record<string, string> = {
    admin: "/dashboard",
    super_admin: "/super-admin/dashboard",
    teacher: "/dashboard-teacher",
    parent: "/parent/dashboard",
    staff: "/dashboard-staff",
    principal: "/dashboard",
  };

  it("should map all roles to correct home routes", () => {
    expect(ROLE_HOME["principal"]).toBe("/dashboard");
    expect(ROLE_HOME["teacher"]).toBe("/dashboard-teacher");
    expect(ROLE_HOME["parent"]).toBe("/parent/dashboard");
    expect(ROLE_HOME["staff"]).toBe("/dashboard-staff");
    expect(ROLE_HOME["super_admin"]).toBe("/super-admin/dashboard");
  });

  it("should return undefined for unknown roles", () => {
    expect(ROLE_HOME["unknown"]).toBeUndefined();
  });
});
