import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Share2, Download } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadUrl?: string | null;
  onDownload?: () => void;
  downloadError?: string | null;
}

export default function SuccessModal({ isOpen, onClose, downloadUrl, onDownload, downloadError }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-white text-2xl w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-gray-800 mb-2">
              Success!
            </DialogTitle>
            <p className="text-gray-600 mb-6">
              Your high-resolution image has been sent to your email. Check your inbox!
            </p>
            {downloadUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm text-gray-700 w-full">
                <p className="font-semibold text-gray-800 mb-2 flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download Available Now
                </p>
                <p className="mb-3">
                  We triggered your email and also prepared a direct download. Click below if it didn&apos;t start automatically.
                </p>
                <Button onClick={onDownload} disabled={!onDownload} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download Image Again
                </Button>
              </div>
            )}
            {downloadError && (
              <p className="text-xs text-red-500 mb-4">
                {downloadError}
              </p>
            )}

            {/* Social sharing prompt */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full">
              <p className="text-sm text-gray-600 mb-3">
                Love your result? Share it now and show the world your amazing pet!
              </p>
              <div className="flex justify-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2"
            >
              Continue Sharing
            </Button>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
