import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/li/business/rary";
import { X, ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function QRScannerDialog({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let reader: BrowserMultiFormatReader | null = new BrowserMultiFormatReader();
    let isScanning = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await reader?.listVideoInputDevices();
        if (!videoInputDevices || videoInputDevices.length === 0) {
          setError("Không tìm thấy camera trên thiết bị này.");
          setLoading(false);
          return;
        }
        
        // Try to prefer back camera
        const backCamera = videoInputDevices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        if (videoRef.current && reader && isScanning) {
          await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
            if (result) {
              const text = result.getText();
              console.log("Scanned:", text);
              // Expected URL: https://bizconnect.one/p/something or /b/something
              try {
                const url = new URL(text);
                const path = url.pathname;
                if (path.startsWith("/p/") || path.startsWith("/business/")) {
                  toast.success("Đã quét mã thành công!");
                  reader?.reset();
                  isScanning = false;
                  onClose();
                  // Extract path and query params properly
                  navigate({ to: path, search: { src: "qr" } as any });
                } else {
                  toast.error("Mã QR này không thuộc hệ thống BizConnect.");
                }
              } catch (e) {
                // If it's a relative path just in case
                if (text.startsWith("/p/") || text.startsWith("/business/")) {
                   toast.success("Đã quét mã thành công!");
                   reader?.reset();
                   isScanning = false;
                   onClose();
                   navigate({ to: text, search: { src: "qr" } as any });
                } else {
                   toast.error("Mã QR không hợp lệ.");
                }
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error("QR Scan Error:", err);
            }
          });
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        setError("Lỗi khi truy cập camera. Vui lòng cấp quyền sử dụng camera.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      isScanning = false;
      if (reader) {
        reader.reset();
        reader = null;
      }
    };
  }, [navigate, onClose]);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-border rounded-3xl">
        <div className="relative flex flex-col items-center justify-center p-6 min-h-[300px]">
          <h3 className="text-xl font-bold font-display mb-2 text-white">Quét mã QR</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Đưa mã QR của thẻ cá nhân hoặc doanh nghiệp vào khung hình để tự động nhận diện.
          </p>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm w-full text-center">
              {error}
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-2xl bg-black/5 shadow-inner">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-accent/20 z-10">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
              <video 
                ref={videoRef} 
                className="absolute inset-0 w-full h-full object-cover" 
                playsInline 
                muted 
              />
              
              {/* Scanner overlay UI */}
              {!loading && (
                <div className="absolute inset-0 z-20 shadow-[0_0_0_4000px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border-2 border-white/50 rounded-xl flex items-center justify-center">
                    <div className="w-[120%] h-[1px] bg-primary/80 animate-scan" />
                    
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg -translate-x-1 -translate-y-1" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg translate-x-1 -translate-y-1" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg -translate-x-1 translate-y-1" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg translate-x-1 translate-y-1" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

