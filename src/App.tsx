import React, { useState, useRef } from "react";
import "./App.css";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import * as QRCode from "qrcode";
import { Slider } from "./components/ui/slider";
import { Label } from "./components/ui/label";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { cn } from "./lib/utils";
import { Checkbox } from "./components/ui/checkbox";

const MAX_SIZE = 500;

const TransparentSwatch = ({ className }: { className: string }) => {
  return (
    <div
      className={cn("rounded-md w-9 h-9 relative overflow-hidden", className)}
    >
      <div
        className="absolute bg-red-500"
        style={{
          width: "141.4%",
          height: "1px",
          top: "50%",
          left: "-20.7%",
          transform: "rotate(45deg)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
};

const ColorField = ({
  placeholder,
  onChange,
  value,
  className,
}: {
  placeholder: string;
  onChange: (color: string) => void;
  value: string;
  className?: string;
}) => {
  const [transparent, setTransparent] = useState(false);
  return (
    <div className={cn("flex gap-2 items-start", className)}>
      <div className="flex items-center h-9">
        <Label htmlFor={placeholder} className="font-bold">
          {placeholder}
        </Label>
      </div>
      <div className="flex-grow flex flex-col gap-2">
        <Input
          id={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          disabled={transparent}
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={transparent}
            onCheckedChange={(isChecked) => {
              setTransparent(!!isChecked);
              if (isChecked) {
                onChange("#00000000");
              }
            }}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Transparent
          </label>
        </div>
      </div>
      {value === "#0000" || value === "#00000000" ? (
        <TransparentSwatch
          className={"w-9 h-9 bg-white flex-shrink-0 border-black"}
        />
      ) : (
        <div
          className={
            "rounded-md w-9 h-9 flex-shrink-0 border-black border border-dotted"
          }
          style={{
            backgroundColor: value,
          }}
        />
      )}
    </div>
  );
};

function App() {
  const [svgString, setSvgString] = useState("");

  const [targetUrl, setTargetUrl] = useState("");
  const [options, setOptions] = useState({
    size: 250,
    foreground: "#000",
    background: "#fff",
  });

  const { toast } = useToast();

  const updateQRCode = (url: string, opts: any) => {
    QRCode.toString(
      url,
      {
        color: {
          dark: opts.foreground, // Blue dots
          light: opts.background, // Transparent background
        },
        type: "svg",
      } as any,
      function (err: Error | null | undefined, dataUrl: string) {
        if (err || !dataUrl) return;
        console.log("url is", dataUrl);
        setSvgString(dataUrl);
      }
    );
  };

  const svgRef = useRef<SVGSVGElement>(null);

  const generatePNGBlob = async (): Promise<Blob | null> => {
    if (!svgRef.current) return null;

    try {
      const svgElement = svgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = options.size;
          canvas.height = options.size;
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob((blob) => resolve(blob), "image/png");
        };

        img.src =
          "data:image/svg+xml;base64," +
          btoa(new XMLSerializer().serializeToString(svgElement));
      });
    } catch (error) {
      console.error("Failed to generate PNG blob:", error);
      return null;
    }
  };

  const copyPNG = async () => {
    const pngBlob = await generatePNGBlob();
    if (!pngBlob) return;

    try {
      const clipboardItem = new ClipboardItem({ "image/png": pngBlob });
      await navigator.clipboard.write([clipboardItem]);

      toast({
        title: "PNG image copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy PNG image:", error);
      toast({
        title: "Failed to copy PNG image",
        variant: "destructive",
      });
    }
  };

  const downloadPNG = async () => {
    const pngBlob = await generatePNGBlob();
    if (!pngBlob) return;

    try {
      const url = URL.createObjectURL(pngBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.png";
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PNG image downloaded",
      });
    } catch (error) {
      console.error("Failed to download PNG image:", error);
      toast({
        title: "Failed to download PNG image",
        variant: "destructive",
      });
    }
  };

  const copySVG = async () => {
    try {
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const clipboardItem = new ClipboardItem({ "image/svg+xml": svgBlob });
      await navigator.clipboard.write([clipboardItem]);
      toast({
        title: "SVG image copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy SVG image:", error);
      toast({
        title: "Failed to copy SVG image",
        variant: "destructive",
      });
    }
  };

  const downloadSVG = () => {
    try {
      const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "qr-code.svg";
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "SVG image downloaded",
      });
    } catch (error) {
      console.error("Failed to download SVG image:", error);
      toast({
        title: "Failed to download SVG image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="p-4 w-full md:p-0 md:w-1/2">
        <div className="flex gap-2 mb-8 items-center">
          <Label htmlFor={"placeholder"} className="font-bold">
            Target
          </Label>
          <Input
            placeholder="URL"
            onChange={(e) => {
              setTargetUrl(e.target.value);
              updateQRCode(e.target.value, options);
            }}
          />
        </div>
        <div className="flex gap-2 mb-2 items-center">
          <Label htmlFor="size" className="font-bold">
            Size
          </Label>
          <Slider
            id="size"
            min={1}
            max={500}
            value={[options.size]}
            onValueChange={(val) => {
              setOptions((prev) => ({ ...prev, size: val[0] }));
            }}
          />
          <Input
            className="w-16 flex-grow-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            type="number"
            value={options.size}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-2">
          <ColorField
            placeholder="Foreground"
            className="md:w-1/2"
            value={options.foreground}
            onChange={(color) => {
              setOptions((prev) => {
                const newOptions = { ...prev, foreground: color };
                updateQRCode(targetUrl, newOptions);
                return newOptions;
              });
            }}
          />

          <ColorField
            placeholder="Background"
            className="md:w-1/2"
            value={options.background}
            onChange={(color) => {
              setOptions((prev) => {
                const newOptions = { ...prev, background: color };
                updateQRCode(targetUrl, newOptions);
                return newOptions;
              });
            }}
          />
        </div>

        <div
          className="flex justify-center items-center"
          style={{ minHeight: MAX_SIZE }}
        >
          {!!svgString && (
            <div style={{ width: options.size, height: options.size }}>
              <svg
                ref={svgRef}
                dangerouslySetInnerHTML={{ __html: svgString }}
                style={{ width: options.size, height: options.size }}
              />
            </div>
          )}

          {!svgString && (
            <div>
              <Skeleton style={{ width: options.size, height: options.size }} />
            </div>
          )}
        </div>
        <div className="flex gap-16 justify-center">
          <div className="flex flex-col gap-2">
            <Button onClick={copySVG}>Copy SVG</Button>
            <Button onClick={downloadSVG}>Download SVG</Button>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={copyPNG}>Copy PNG</Button>
            <Button onClick={downloadPNG}>Download PNG</Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
