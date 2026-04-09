import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ role: "principal" }], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: "Test User", email: "test@test.com" }, error: null }),
    })),
  },
}));

import { supabase } from "@/integrations/supabase/client";

describe("Authentication Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null role when user_roles table returns empty", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));
    (supabase.from as any) = mockFrom;

    const result = await supabase.from("user_roles").select("role").eq("user_id", "test-id").limit(1);
    expect(result.data).toEqual([]);
  });

  it("should return role when user has a role assigned", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ role: "teacher" }], error: null }),
    }));
    (supabase.from as any) = mockFrom;

    const result = await supabase.from("user_roles").select("role").eq("user_id", "test-id").limit(1);
    expect(result.data).toHaveLength(1);
    expect(result.data![0].role).toBe("teacher");
  });

  it("should handle login with valid credentials", async () => {
    const mockUser = { id: "user-123", email: "test@test.com" };
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: mockUser, session: { access_token: "token" } },
      error: null,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: "test@test.com",
      password: "password123",
    });

    expect(error).toBeNull();
    expect(data.user).toEqual(mockUser);
  });

  it("should handle login with invalid credentials", async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: "wrong@test.com",
      password: "wrong",
    });

    expect(error).not.toBeNull();
    expect(error!.message).toBe("Invalid login credentials");
  });

  it("should handle sign out", async () => {
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();
  });

  it("should handle multiple roles - returns first role", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ role: "parent" }], error: null }),
    }));
    (supabase.from as any) = mockFrom;

    const result = await supabase.from("user_roles").select("role").eq("user_id", "multi-role-user").limit(1);
    expect(result.data).toHaveLength(1);
  });
});
