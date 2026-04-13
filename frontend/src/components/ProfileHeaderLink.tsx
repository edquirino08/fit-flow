import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export function ProfileHeaderLink() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return row as { display_name: string | null };
    },
  });
  if (!user) return null;
  const label = data?.display_name?.trim() || "Perfil";
  return (
    <Link
      to="/perfil"
      className="focus-ring hidden max-w-[140px] truncate text-xs font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-ink sm:ml-2 sm:inline-block md:max-w-[200px]"
      title={label}
    >
      {label}
    </Link>
  );
}
