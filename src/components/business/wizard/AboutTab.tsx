import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BusinessFormValues } from "./schema";

export function AboutTab() {
  const { register, watch } = useFormContext<BusinessFormValues>();
  const shortIntro = watch("short_intro") || "";
  const description = watch("description") || "";

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="short_intro">Giới thiệu ngắn (tagline)</Label>
        <Textarea
          id="short_intro"
          rows={2}
          maxLength={240}
          {...register("short_intro")}
          placeholder="Một câu mô tả ngắn gọn, hiển thị dưới tên doanh nghiệp."
        />
        <p className="text-xs text-muted-foreground text-right mt-1">{shortIntro.length}/240</p>
      </div>
      <div>
        <Label htmlFor="description">Nội dung giới thiệu chi tiết</Label>
        <Textarea
          id="description"
          rows={10}
          maxLength={4000}
          {...register("description")}
          placeholder="Lịch sử, sứ mệnh, sản phẩm/dịch vụ tiêu biểu, đối tác chính, thành tựu nổi bật…"
        />
        <p className="text-xs text-muted-foreground text-right mt-1">{description.length}/4000</p>
      </div>
    </div>
  );
}
