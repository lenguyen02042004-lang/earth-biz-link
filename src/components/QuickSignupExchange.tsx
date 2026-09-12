import { useState } from "react";
import { supa/business/ase } from "@/integrations/supabase/client";
import { slugifyName } from "@/lib/personal-card";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  toId: string;
  toType: "business" | "personal";
  onSuccess: () => void;
}

export function QuickSignupExchange({ toId, toType, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    
    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
        }
      }
    });

    if (authError || !authData.user) {
      toast.error(authError?.message || "Lỗi tạo tài khoản");
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // 2. Update profile
    await supabase.from("profiles").update({ 
      display_name: name,
      account_type: "personal" 
    }).eq("id", userId);

    // 3. Create personal profile card
    await supabase.from("personal_profiles").upsert({
      user_id: userId,
      full_name: name,
      slug: slugifyName(name),
      email,
      phone,
      job_title: "Thành viên mới",
    });

    // 4. Send card visit
    const { error: sendError } = await supabase.from("inbox").insert({
      from_user: userId,
      to_business: toType === "business" ? toId : null,
      to_user: toType === "personal" ? toId : null,
      subject: "Xin chào, tôi muốn kết nối giao thương",
      body: "Tôi vừa quét mã QR của bạn tại sự kiện.",
      status: "unread",
    });

    if (sendError) {
      console.error(sendError);
      toast.error("Tạo tài khoản thành công nhưng lỗi gửi danh thiếp");
    } else {
      toast.success("Đã tạo tài khoản và tự động trao đổi danh thiếp!");
      onSuccess();
    }
    
    // 5. Automatically save their card to the newly created wallet
    if (toType === "business") {
      await supabase.from("saved_contacts").insert({
        user_id: userId,
        business_id: toId,
      });
    } else if (toType === "personal") {
      await supabase.from("saved_contacts").insert({
        user_id: userId,
        saved_user_id: toId,
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-bold mb-1">Trao đổi danh thiếp nhanh</h3>
        <p className="text-xs text-muted-foreground">Tạo tài khoản cá nhân trong 10 giây để gửi danh thiếp của bạn.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input 
          placeholder="Họ và tên" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          disabled={loading}
        />
        <Input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={loading}
        />
        <Input 
          type="tel" 
          placeholder="Số điện thoại" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)} 
          required 
          disabled={loading}
        />
        <Input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          disabled={loading}
        />
        <Button type="submit" className="w-full bg-gradient-vivid text-white border-0" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Tạo thẻ & Kết nối ngay
        </Button>
      </form>
    </div>
  );
}
