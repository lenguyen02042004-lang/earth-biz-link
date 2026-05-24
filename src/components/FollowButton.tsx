import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  businessId: string;
  initialCount?: number;
  variant?: "icon" | "full";
  className?: string;
}

export function FollowButton({ businessId, initialCount = 0, variant = "full", className }: Props) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const isRealBusiness = UUID_RE.test(businessId);

  useEffect(() => {
    if (!isRealBusiness) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("business_id", businessId)
        .eq("follower_id", user.id)
        .maybeSingle();
      if (active && data) setFollowing(true);
    })();
    return () => { active = false; };
  }, [businessId, isRealBusiness]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vui lòng đăng nhập để theo dõi");
      navigate({ to: "/login" });
      return;
    }

    if (!isRealBusiness) {
      // Mock business — just toggle UI
      setFollowing((f) => !f);
      setCount((c) => c + (following ? -1 : 1));
      toast.success(following ? "Đã bỏ theo dõi" : "Đã theo dõi (demo)");
      return;
    }

    setLoading(true);
    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("business_id", businessId)
        .eq("follower_id", user.id);
      if (!error) { setFollowing(false); setCount((c) => Math.max(0, c - 1)); }
      else toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ business_id: businessId, follower_id: user.id });
      if (!error) { setFollowing(true); setCount((c) => c + 1); }
      else toast.error(error.message);
    }
    setLoading(false);
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        size="icon"
        variant={following ? "default" : "outline"}
        onClick={handleToggle}
        disabled={loading}
        title={following ? "Bỏ theo dõi" : "Theo dõi"}
        className={`h-10 w-10 ${following ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""} ${className ?? ""}`}
      >
        <Heart className={`w-4 h-4 ${following ? "fill-current" : ""}`} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "default" : "outline"}
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1.5 ${following ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""} ${className ?? ""}`}
    >
      <Heart className={`w-3.5 h-3.5 ${following ? "fill-current" : ""}`} />
      <span className="text-xs font-medium">
        {following ? "Đang theo dõi" : "Theo dõi"}
      </span>
      {count > 0 && <span className="text-xs opacity-75">· {count}</span>}
    </Button>
  );
}
