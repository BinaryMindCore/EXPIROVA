import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import API from "../api/axios";
import scanShowcaseImg from "../assets/scan-showcase.png";
import {
  saveNewInventoryItem,
  toLocalDateTimeInputValue,
  calculateStatusAndExpiry,
  getDefaultLocationForCategory,
} from "../utils/inventoryStore";
import {
  scanBarcodeFromFile,
  scanBarcodeFromElement,
  scanWithVisionAI,
  fetchProductByBarcode,
  getSuggestedStorage,
} from "../utils/barcodeScanner";

const CATEGORY_OPTIONS = [
  "Hair Care",
  "Skin Care",
  "Personal Care",
  "Food & Grocery",
  "Beverage",
  "Medicine",
  "Household",
  "General Goods",
];

const STORAGE_PRESETS = [
  "Bathroom Shelf",
  "Pantry",
  "Refrigerator",
  "Medicine Cabinet",
  "Kitchen Cabinet",
  "Storage Closet",
  "Dresser / Vanity",
  "General Storage",
];

export function Aiscancontent() {
  const fileInputRef = useRef(null);
  const qrScannerRef = useRef(null);
  const autoSampleIntervalRef = useRef(null);
  const frameCountRef = useRef(0);

  const [activeTab, setActiveTab] = useState("scan"); // "scan" | "custom"
  const [productName, setProductName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [lastSavedItem, setLastSavedItem] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [scanNotice, setScanNotice] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [pendingScan, setPendingScan] = useState(null);

  // Viewfinder status: "analyzing" (yellow) | "locked" (green) | "reposition" (red)
  const [viewfinderStatus, setViewfinderStatus] = useState("analyzing");

  const pendingStatusPreview = pendingScan?.expiryDate
    ? calculateStatusAndExpiry(pendingScan.expiryDate)
    : null;

  const [customForm, setCustomForm] = useState(() => {
    const defaultExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    return {
      name: "",
      category: "Personal Care",
      location: "Bathroom Shelf",
      expiryDate: toLocalDateTimeInputValue(defaultExpiry),
      mfgDate: toLocalDateTimeInputValue(new Date()),
      barcode: "",
    };
  });

  const liveStatusPreview = calculateStatusAndExpiry(customForm.expiryDate);

  const setQuickExpiry = (hours) => {
    const target = new Date(Date.now() + hours * 60 * 60 * 1000);
    setCustomForm((prev) => ({
      ...prev,
      expiryDate: toLocalDateTimeInputValue(target),
    }));
  };

  /**
   * Process a confirmed barcode string (from camera, file, or manual lookup)
   * Queries Open Food Facts -> Open Beauty Facts -> UPCItemDB
   */
  const handleBarcodeDetected = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    const cleanBarcode = barcode.trim();

    try {
      setLoading(true);
      setViewfinderStatus("locked");
      setSuccessMsg("");
      setScanNotice("");

      const meta = await fetchProductByBarcode(cleanBarcode);
      const defaultExpiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days default
      const isoDate = toLocalDateTimeInputValue(defaultExpiry);

      if (meta && meta.found) {
        const cat = meta.category || "Personal Care";
        const loc = meta.storageSuggestion || getSuggestedStorage(cat);

        setPendingScan({
          name: meta.name || `Product #${cleanBarcode}`,
          brand: meta.brand || "",
          category: cat,
          location: loc,
          expiryDate: isoDate,
          mfgDate: toLocalDateTimeInputValue(new Date()),
          barcode: cleanBarcode,
          imageUrl: meta.imageUrl || null,
          confidenceScore: 100,
          engine: meta.source || "Universal Barcode Catalog",
          wasFound: true,
          isVisionAI: false,
        });

        setProductName(meta.name || `Product #${cleanBarcode}`);
        setExpiryDate(isoDate);
        setSuccessMsg(`✅ Barcode ${cleanBarcode} Recognized: "${meta.name}"`);
      } else {
        // Clean not-found handling without injecting mock medicine data
        setScanNotice(`Barcode ${cleanBarcode} captured, but not in online catalogs. Please enter details or upload packaging photo for Vision AI.`);
        setPendingScan({
          name: `Item #${cleanBarcode}`,
          brand: "",
          category: "Personal Care",
          location: "Bathroom Shelf",
          expiryDate: isoDate,
          mfgDate: toLocalDateTimeInputValue(new Date()),
          barcode: cleanBarcode,
          confidenceScore: 80,
          engine: "Barcode Detected (Unregistered)",
          wasFound: false,
          isVisionAI: false,
        });
      }
    } catch (err) {
      console.error("Barcode processing error:", err);
      setScanNotice(`Barcode ${cleanBarcode} captured. You can fill in the details manually below.`);
      const defaultExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      setPendingScan({
        name: `Item #${cleanBarcode}`,
        brand: "",
        category: "Personal Care",
        location: "Bathroom Shelf",
        expiryDate: toLocalDateTimeInputValue(defaultExpiry),
        mfgDate: toLocalDateTimeInputValue(new Date()),
        barcode: cleanBarcode,
        confidenceScore: 80,
        engine: "Barcode Captured",
        wasFound: false,
        isVisionAI: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = async () => {
    if (autoSampleIntervalRef.current) {
      clearInterval(autoSampleIntervalRef.current);
      autoSampleIntervalRef.current = null;
    }
    if (qrScannerRef.current) {
      try {
        if (qrScannerRef.current.isScanning) {
          await qrScannerRef.current.stop();
        }
        qrScannerRef.current.clear();
      } catch (err) {
        console.warn("Camera stop warning:", err);
      }
      qrScannerRef.current = null;
    }
    setCameraOpen(false);
    setViewfinderStatus("analyzing");
  };

  const handleScan = () => {
    setCameraError("");
    setViewfinderStatus("analyzing");
    frameCountRef.current = 0;
    setCameraOpen(true);
  };

  /**
   * Live real-time camera scanner initialization
   * Samples frames every 300ms so user does not need to snap manual pictures
   */
  useEffect(() => {
    let isCancelled = false;

    if (cameraOpen) {
      const initCameraScanner = async () => {
        try {
          await new Promise((r) => setTimeout(r, 150));
          if (isCancelled) return;

          const container = document.getElementById("interactive-camera-reader");
          if (!container) return;

          if (qrScannerRef.current) {
            try {
              if (qrScannerRef.current.isScanning) {
                await qrScannerRef.current.stop();
              }
              qrScannerRef.current.clear();
            } catch {
              /* ignore clear error */
            }
          }

          const formatsToSupport = [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
          ];

          const html5QrCode = new Html5Qrcode("interactive-camera-reader", {
            formatsToSupport,
            verbose: false,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          });
          qrScannerRef.current = html5QrCode;

          let cameraConfig = { facingMode: "environment" };
          try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const backCam = devices.find((d) =>
                /back|rear|environment/i.test(d.label)
              );
              cameraConfig = backCam ? backCam.id : devices[0].id;
            }
          } catch (camErr) {
            console.warn("Could not list cameras, using facingMode:", camErr);
          }

          if (isCancelled) return;

          await html5QrCode.start(
            cameraConfig,
            {
              fps: 15,
              qrbox: (w, h) => ({
                width: Math.min(Math.floor(w * 0.92), 420),
                height: Math.min(Math.floor(h * 0.65), 240),
              }),
              aspectRatio: 1.777778,
            },
            async (decodedText) => {
              if (isCancelled) return;
              console.log("⚡ Live camera barcode successfully captured:", decodedText);
              setViewfinderStatus("locked");
              await stopCamera();
              handleBarcodeDetected(decodedText);
            },
            () => {}
          );

          // 300ms Frame Sampling Engine for real-time detection
          autoSampleIntervalRef.current = setInterval(async () => {
            if (isCancelled || !qrScannerRef.current?.isScanning) return;
            frameCountRef.current += 1;

            const video = document.querySelector("#interactive-camera-reader video");
            if (video && video.videoWidth > 0 && video.readyState >= 2) {
              try {
                const sampleBarcode = await scanBarcodeFromElement(video);
                if (sampleBarcode) {
                  console.log("🎯 300ms frame sample recognized barcode:", sampleBarcode);
                  setViewfinderStatus("locked");
                  if (autoSampleIntervalRef.current) {
                    clearInterval(autoSampleIntervalRef.current);
                    autoSampleIntervalRef.current = null;
                  }
                  await stopCamera();
                  handleBarcodeDetected(sampleBarcode);
                  return;
                }
              } catch {
                /* continue frame sampling */
              }

              if (frameCountRef.current > 15 && frameCountRef.current % 12 === 0) {
                setViewfinderStatus((prev) => (prev === "analyzing" ? "reposition" : "analyzing"));
              }
            }
          }, 300);
        } catch (err) {
          if (!isCancelled) {
            console.error("Camera startup error:", err);
            setCameraError(
              err?.name === "NotAllowedError" || String(err).includes("Permission")
                ? "Camera permission denied. Please allow camera access in your browser."
                : "Unable to start camera stream. You can capture a photo or enter barcode below."
            );
          }
        }
      };

      initCameraScanner();
    } else {
      if (autoSampleIntervalRef.current) {
        clearInterval(autoSampleIntervalRef.current);
        autoSampleIntervalRef.current = null;
      }
      if (qrScannerRef.current) {
        stopCamera();
      }
    }

    return () => {
      isCancelled = true;
      if (autoSampleIntervalRef.current) {
        clearInterval(autoSampleIntervalRef.current);
        autoSampleIntervalRef.current = null;
      }
      if (qrScannerRef.current) {
        try {
          if (qrScannerRef.current.isScanning) {
            qrScannerRef.current.stop();
          }
          qrScannerRef.current.clear();
        } catch {
          /* ignore unmount clear error */
        }
        qrScannerRef.current = null;
      }
    };
  }, [cameraOpen]);

  /**
   * Capture still photo from running camera stream and scan with dual-engine pipeline
   */
  const captureImage = async () => {
    try {
      setLoading(true);
      setViewfinderStatus("analyzing");
      const container = document.getElementById("interactive-camera-reader");
      const video = container?.querySelector("video");
      if (!video || !video.videoWidth) {
        alert("Camera stream is not ready yet. Please wait a moment.");
        setLoading(false);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            alert("Could not capture image from camera.");
            setLoading(false);
            return;
          }
          const file = new File([blob], `camera-capture-${Date.now()}.png`, { type: "image/png" });
          await stopCamera();
          await uploadImage(file);
        },
        "image/png",
        0.98
      );
    } catch (err) {
      console.error("Camera snapshot error:", err);
      alert("Error capturing photo from camera.");
      setLoading(false);
    }
  };



  /**
   * Direct barcode lookup button handler
   */
  const handleDirectBarcodeLookup = (overrideCode) => {
    const code = overrideCode || barcodeInput.trim();
    if (!code) {
      alert("Please enter a barcode number to look up.");
      return;
    }
    handleBarcodeDetected(code);
  };

  /**
   * Dual-Engine Detection Pipeline:
   * 1. Primary Pass: Fast Client-Side Barcode Scanning (Preprocessed Canvas + 90° Sweep)
   * 2. Secondary Pass: Category-Agnostic Multimodal Vision AI Fallback (Shampoo, Cosmetics, Food, Medicines)
   */
  const uploadImage = async (file) => {
    try {
      setLoading(true);
      setViewfinderStatus("analyzing");
      setSuccessMsg("");
      setScanNotice("Scanning barcode lines (0°-270° rotation & contrast enhancement)...");

      // 1. Primary Pass: Fast Client-Side Barcode Scanning
      const detectedBarcode = await scanBarcodeFromFile(file);

      if (detectedBarcode) {
        console.log("📸 Barcode detected from photo:", detectedBarcode);
        setViewfinderStatus("locked");
        setScanNotice("");
        await handleBarcodeDetected(detectedBarcode);
        return;
      }

      // 2. Secondary Pass: Multimodal Vision AI Fallback
      setScanNotice("⚡ No barcode detected — identifying item text and label with Vision AI...");

      const visionData = await scanWithVisionAI(file);

      if (visionData && visionData.detected) {
        setViewfinderStatus("locked");
        const cat = visionData.category || "Personal Care";
        const loc = visionData.storageSuggestion || getSuggestedStorage(cat);

        let formattedExpiry = "";
        if (visionData.expiryDate) {
          const d = new Date(visionData.expiryDate);
          formattedExpiry = !isNaN(d.getTime())
            ? toLocalDateTimeInputValue(d)
            : toLocalDateTimeInputValue(new Date(Date.now() + 180 * 86400000));
        } else {
          // If no expiry date found on bottle, default to null or standard 180 days
          formattedExpiry = toLocalDateTimeInputValue(new Date(Date.now() + 180 * 86400000));
        }

        const confidence = visionData.confidenceScore || 95;

        setPendingScan({
          name: visionData.productName || "Recognized Product",
          brand: visionData.brand || "",
          category: cat,
          location: loc,
          expiryDate: formattedExpiry,
          mfgDate: toLocalDateTimeInputValue(new Date()),
          barcode: visionData.barcode || `AI-${Date.now().toString().slice(-6)}`,
          confidenceScore: confidence,
          engine: visionData.engine || "Multimodal Vision AI Engine",
          wasFound: true,
          isVisionAI: true,
        });

        setProductName(visionData.productName);
        setExpiryDate(formattedExpiry);
        setSuccessMsg(
          `⚡ Identified: "${visionData.productName}" (${cat} • ${confidence}% confidence)`
        );
        setScanNotice("");
      } else {
        // Clean failure message without fake Paracetamol
        setViewfinderStatus("reposition");
        setPendingScan(null);
        setScanNotice(
          visionData?.message ||
            "No packaging text or product recognized in this photo. Please ensure good lighting and clear view of label."
        );
      }
    } catch (err) {
      console.error("Upload error:", err);
      setViewfinderStatus("reposition");
      setPendingScan(null);
      setScanNotice(
        "Could not decode image. Please try another photo or enter product details manually."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * One-Tap Confirm & Add Action
   */
  const handleConfirmPendingScan = (e) => {
    e.preventDefault();
    if (!pendingScan || !pendingScan.name.trim() || !pendingScan.expiryDate) {
      alert("Please ensure product name and expiration date are set.");
      return;
    }

    const loc =
      pendingScan.location.trim() ||
      getDefaultLocationForCategory(pendingScan.category);

    const savedItem = saveNewInventoryItem({
      name: pendingScan.name.trim(),
      category: pendingScan.category,
      location: loc,
      expiryDate: pendingScan.expiryDate,
      mfgDate: pendingScan.mfgDate,
      barcode: pendingScan.barcode,
    });

    API.post("/products", {
      productName: savedItem.title,
      category: savedItem.categoryType,
      barcode: savedItem.barcode,
      expiryDate: savedItem.expiryDate,
      daysBeforeNotification: 7,
    }).catch((err) => {
      console.warn("Backend product sync notice:", err?.message);
    });

    setProductName(savedItem.title);
    setExpiryDate(savedItem.expiry);
    setLastSavedItem(savedItem);
    setSuccessMsg(`"${savedItem.title}" saved to inventory (${savedItem.location}) & dashboard!`);
    setPendingScan(null);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customForm.name.trim() || !customForm.expiryDate) {
      alert("Please enter the product name and expiration date.");
      return;
    }

    const loc = customForm.location.trim() || getDefaultLocationForCategory(customForm.category);

    const saved = saveNewInventoryItem({
      name: customForm.name.trim(),
      category: customForm.category,
      location: loc,
      expiryDate: customForm.expiryDate,
      mfgDate: customForm.mfgDate,
      barcode: customForm.barcode,
    });

    API.post("/products", {
      productName: saved.title,
      category: saved.categoryType,
      barcode: saved.barcode,
      expiryDate: saved.expiryDate,
      daysBeforeNotification: 7,
    }).catch((err) => {
      console.warn("Backend product sync notice:", err?.message);
    });

    setProductName(saved.title);
    setExpiryDate(saved.expiry);
    setLastSavedItem(saved);
    setSuccessMsg(`"${saved.title}" added to inventory & dashboard!`);

    setCustomForm({
      name: "",
      category: "Personal Care",
      location: "Bathroom Shelf",
      expiryDate: "",
      mfgDate: new Date().toISOString().split("T")[0],
      barcode: "",
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#f8fafc] text-slate-800 pt-20 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[320px] bg-slate-200/60 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-[#0d5f94] text-xs font-medium shadow-sm mb-3">
            <span className="material-symbols-outlined text-[16px] text-[#0d5f94]">auto_awesome</span>
            Universal Barcode & Multimodal Vision AI Scanner
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Universal Product Identification
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Scan any product packaging (shampoo, cosmetics, food, beverages, medicines) via barcode or packaging label. Multimodal AI automatically extracts product names, brands, categories, and expiry dates.
          </p>
        </div>

        {/* 2-Column Showcase / Scanner Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Visual Showcase or Live Camera */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-lg">
              <div className="relative aspect-[16/11] w-full overflow-hidden flex items-center justify-center bg-slate-900">
                {!cameraOpen ? (
                  <>
                    <img
                      src={scanShowcaseImg}
                      alt="AI Scanning Showcase"
                      className="w-full h-full object-cover object-center"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/10" />

                    <div
                      className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]"
                      style={{ animation: "scanMove 3s ease-in-out infinite" }}
                    />

                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-mono text-cyan-300 font-medium">UNIVERSAL SCANNER READY</span>
                    </div>

                    <div className="absolute top-4 right-4 bg-[#0d5f94]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md">
                      Instant Recognition
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">Target Area</p>
                          <p className="text-sm font-semibold text-white">Barcode, Front Label or Expiry Stamp</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full flex flex-col justify-between bg-black">
                    {cameraError ? (
                      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-30">
                        <span className="material-symbols-outlined text-amber-400 text-4xl mb-2">
                          videocam_off
                        </span>
                        <p className="text-white font-semibold text-sm mb-1">
                          Camera Unavailable
                        </p>
                        <p className="text-xs text-slate-300 max-w-xs mb-4">
                          {cameraError}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          <button
                            onClick={handleScan}
                            className="bg-[#0d5f94] hover:bg-[#0b527f] text-white text-xs px-4 py-2 rounded-lg font-medium transition shadow-sm"
                          >
                            Retry Camera
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
                          >
                            Upload Photo Instead
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          id="interactive-camera-reader"
                          className="w-full h-full min-h-[320px] flex items-center justify-center overflow-hidden bg-black"
                        />

                        {/* Viewfinder HUD Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                          <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                          <div
                            className={`relative w-[84%] max-w-[400px] h-[210px] sm:h-[230px] rounded-2xl transition-all duration-300 ${
                              viewfinderStatus === "locked"
                                ? "border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)]"
                                : viewfinderStatus === "reposition"
                                ? "border-2 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]"
                                : "border-2 border-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                            }`}
                          >
                            {/* 4 Corner Guides */}
                            <span
                              className={`absolute -top-1.5 -left-1.5 w-7 h-7 border-t-[3.5px] border-l-[3.5px] rounded-tl-xl transition-colors duration-300 ${
                                viewfinderStatus === "locked"
                                  ? "border-emerald-400"
                                  : viewfinderStatus === "reposition"
                                  ? "border-rose-500"
                                  : "border-amber-400"
                              }`}
                            />
                            <span
                              className={`absolute -top-1.5 -right-1.5 w-7 h-7 border-t-[3.5px] border-r-[3.5px] rounded-tr-xl transition-colors duration-300 ${
                                viewfinderStatus === "locked"
                                  ? "border-emerald-400"
                                  : viewfinderStatus === "reposition"
                                  ? "border-rose-500"
                                  : "border-amber-400"
                              }`}
                            />
                            <span
                              className={`absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-[3.5px] border-l-[3.5px] rounded-bl-xl transition-colors duration-300 ${
                                viewfinderStatus === "locked"
                                  ? "border-emerald-400"
                                  : viewfinderStatus === "reposition"
                                  ? "border-rose-500"
                                  : "border-amber-400"
                              }`}
                            />
                            <span
                              className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-[3.5px] border-r-[3.5px] rounded-br-xl transition-colors duration-300 ${
                                viewfinderStatus === "locked"
                                  ? "border-emerald-400"
                                  : viewfinderStatus === "reposition"
                                  ? "border-rose-500"
                                  : "border-amber-400"
                              }`}
                            />

                            {viewfinderStatus === "analyzing" && (
                              <div
                                className="absolute left-0 w-full h-[2.5px] bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_15px_#fbbf24]"
                                style={{ animation: "scanMove 2.2s ease-in-out infinite" }}
                              />
                            )}
                            {viewfinderStatus === "locked" && (
                              <div className="absolute inset-0 bg-emerald-500/15 rounded-2xl animate-pulse" />
                            )}

                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                              <span
                                className={`text-[11px] font-bold px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg border transition-all ${
                                  viewfinderStatus === "locked"
                                    ? "bg-emerald-950/90 text-emerald-300 border-emerald-400/60"
                                    : viewfinderStatus === "reposition"
                                    ? "bg-rose-950/90 text-rose-300 border-rose-400/60"
                                    : "bg-amber-950/90 text-amber-300 border-amber-400/60"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    viewfinderStatus === "locked"
                                      ? "bg-emerald-400 animate-ping"
                                      : viewfinderStatus === "reposition"
                                      ? "bg-rose-400"
                                      : "bg-amber-400 animate-pulse"
                                  }`}
                                />
                                {viewfinderStatus === "locked"
                                  ? "Item Recognized & Locked"
                                  : viewfinderStatus === "reposition"
                                  ? "Reposition Package / Check Lighting"
                                  : "Analyzing Frame • 300ms Auto-Sample"}
                              </span>
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                              <div className="w-8 h-[1px] bg-white" />
                              <div className="h-8 w-[1px] bg-white absolute" />
                            </div>

                            <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 pointer-events-auto whitespace-nowrap">
                              <button
                                type="button"
                                onClick={captureImage}
                                disabled={loading}
                                className="px-3.5 py-1.5 bg-[#0d5f94]/90 hover:bg-[#0b527f] active:scale-95 backdrop-blur-md text-white text-[11px] font-bold rounded-full shadow-lg border border-cyan-400/40 flex items-center gap-1.5 transition disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[15px] text-cyan-300">auto_awesome</span>
                                {loading ? "Analyzing Packaging..." : "Auto-Identify with AI Vision"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
                      <span className="text-white text-xs font-semibold flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Live Continuous Auto-Scan (300ms)
                      </span>
                      <button
                        onClick={stopCamera}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-medium transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Close
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-center pointer-events-none">
                      <span className="text-[11px] text-slate-200 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                        Hold barcode or packaging label steady inside viewfinder
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Results Card */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d5f94]">
                    {activeTab === "custom" ? "edit_note" : cameraOpen ? "center_focus_strong" : "qr_code_scanner"}
                  </span>
                  {activeTab === "custom"
                    ? "Custom Manual Entry"
                    : cameraOpen
                    ? "Live Camera Active"
                    : "Add Product to Inventory"}
                </h2>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("scan");
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "scan"
                      ? "bg-white text-[#0d5f94] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                  AI Camera & Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setActiveTab("custom");
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "custom"
                      ? "bg-white text-[#0d5f94] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Custom Entry
                </button>
              </div>

              {/* TAB 1: AI CAMERA & UPLOAD MODE */}
              {activeTab === "scan" ? (
                <>
                  {/* Smart Notification / Vision Fallback Banner */}
                  {scanNotice && (
                    <div
                      className={`mb-4 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all animate-fadeIn ${
                        scanNotice.includes("Vision AI") || scanNotice.includes("identifying item text")
                          ? "bg-cyan-50/90 border-cyan-200 text-cyan-900 shadow-sm"
                          : scanNotice.includes("captured") || scanNotice.includes("Recognized")
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-amber-50 border-amber-200 text-amber-900"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] shrink-0 ${
                          scanNotice.includes("Vision AI") || scanNotice.includes("identifying item text")
                            ? "text-cyan-600 animate-spin"
                            : scanNotice.includes("captured")
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {scanNotice.includes("Vision AI") || scanNotice.includes("identifying item text")
                          ? "progress_activity"
                          : scanNotice.includes("captured")
                          ? "check_circle"
                          : "info"}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold leading-relaxed">{scanNotice}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScanNotice("")}
                        className="text-slate-400 hover:text-slate-600 transition"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                      </button>
                    </div>
                  )}

                  {/* Direct Barcode Search / Manual Lookup Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-5 shadow-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#0d5f94]">barcode_scanner</span>
                        Multi-Database Barcode Lookup
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Food • Beauty • UPC</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter barcode (e.g. 8901030383987 for Sunsilk)..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleDirectBarcodeLookup()}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDirectBarcodeLookup()}
                        disabled={loading || !barcodeInput.trim()}
                        className="px-4 py-2 bg-[#0d5f94] hover:bg-[#0b527f] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">search</span>
                        {loading ? "Searching..." : "Lookup"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">Quick Test:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeInput("8901030383987");
                          handleBarcodeDetected("8901030383987");
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[#0d5f94] font-mono text-[10px] transition"
                      >
                        8901030383987 (Sunsilk Shampoo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeInput("3017620422003");
                          handleBarcodeDetected("3017620422003");
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[#0d5f94] font-mono text-[10px] transition"
                      >
                        3017620422003 (Nutella)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeInput("737628064502");
                          handleBarcodeDetected("737628064502");
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[#0d5f94] font-mono text-[10px] transition"
                      >
                        737628064502 (Thai Noodles)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeInput("8901030865421");
                          handleBarcodeDetected("8901030865421");
                        }}
                        className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[#0d5f94] font-mono text-[10px] transition"
                      >
                        8901030865421 (Dolo 650)
                      </button>
                    </div>
                  </div>

                  {/* AUTO-FILLED OUTPUT FORM */}
                  {pendingScan ? (
                    <form
                      onSubmit={handleConfirmPendingScan}
                      className="bg-white border-2 border-emerald-400/60 rounded-2xl p-4 sm:p-5 mb-6 space-y-4 shadow-md animate-fadeIn"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span
                            className={`material-symbols-outlined text-[22px] ${
                              pendingScan.isVisionAI ? "text-cyan-600" : "text-emerald-600"
                            }`}
                          >
                            {pendingScan.isVisionAI ? "auto_awesome" : "verified"}
                          </span>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              {pendingScan.isVisionAI
                                ? "Vision AI Auto-Extracted Product"
                                : "Barcode Verified Product"}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              {pendingScan.isVisionAI
                                ? "Extracted exact brand, product name, and expiry from packaging"
                                : "Matched against Open Food/Beauty Facts & UPC catalog"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendingScan(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-medium flex items-center gap-0.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          Discard
                        </button>
                      </div>

                      {/* Highlighted Confidence Score & Engine Tag */}
                      <div
                        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                          pendingScan.isVisionAI
                            ? "bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 text-cyan-900"
                            : "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-full shadow-xs ${
                              pendingScan.isVisionAI
                                ? "bg-[#0d5f94] text-white"
                                : "bg-emerald-600 text-white"
                            }`}
                          >
                            ⚡ {pendingScan.confidenceScore}% Confidence
                          </span>
                          <span className="text-xs font-semibold">
                            {pendingScan.engine}
                          </span>
                        </div>
                        {pendingScan.barcode && (
                          <span className="text-[11px] font-mono text-slate-600 bg-white/70 px-2 py-0.5 rounded border border-slate-200/60">
                            Code: {pendingScan.barcode}
                          </span>
                        )}
                      </div>

                      {/* Product Name Field */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Product Name & Brand <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            Auto-Filled
                          </span>
                        </div>
                        <input
                          type="text"
                          value={pendingScan.name}
                          onChange={(e) => setPendingScan({ ...pendingScan, name: e.target.value })}
                          required
                          className="w-full px-3.5 py-2.5 bg-emerald-50/20 border-2 border-emerald-400/80 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] transition"
                        />
                      </div>

                      {/* Category & Storage Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-800">
                              Category Tag
                            </label>
                            <span className="text-[10px] text-slate-500">Auto-Tagged</span>
                          </div>
                          <select
                            value={pendingScan.category}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setPendingScan((prev) => ({
                                ...prev,
                                category: newCat,
                                location: getSuggestedStorage(newCat),
                              }));
                            }}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                          >
                            {CATEGORY_OPTIONS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-slate-800">
                              Storage Location
                            </label>
                            <span className="text-[10px] text-slate-500 font-mono">Suggested</span>
                          </div>
                          <div className="space-y-1.5">
                            <select
                              value={STORAGE_PRESETS.includes(pendingScan.location) ? pendingScan.location : "custom"}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val !== "custom") {
                                  setPendingScan({ ...pendingScan, location: val });
                                }
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                            >
                              {STORAGE_PRESETS.map((preset) => (
                                <option key={preset} value={preset}>
                                  {preset}
                                </option>
                              ))}
                              <option value="custom">Enter Custom Location...</option>
                            </select>

                            {(!STORAGE_PRESETS.includes(pendingScan.location) || pendingScan.location === "custom") && (
                              <input
                                type="text"
                                placeholder="e.g. Bathroom Top Shelf, Master Closet"
                                value={pendingScan.location === "custom" ? "" : pendingScan.location}
                                onChange={(e) => setPendingScan({ ...pendingScan, location: e.target.value })}
                                required
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Expiry Date & Time <span className="text-red-500">*</span>
                          </label>
                          {pendingStatusPreview && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pendingStatusPreview.statusColor}`}>
                              {pendingStatusPreview.status} • {pendingStatusPreview.expiry}
                            </span>
                          )}
                        </div>
                        <input
                          type="datetime-local"
                          value={pendingScan.expiryDate}
                          onChange={(e) => setPendingScan({ ...pendingScan, expiryDate: e.target.value })}
                          required
                          className="w-full px-3 py-2.5 bg-emerald-50/20 border-2 border-emerald-400/80 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                        />

                        {/* Quick Date Presets */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-500 self-center mr-0.5">Quick Adjust:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                              setPendingScan((prev) => ({ ...prev, expiryDate: toLocalDateTimeInputValue(target) }));
                            }}
                            className="text-[10px] bg-blue-50 hover:bg-blue-100 text-[#0d5f94] px-2 py-0.5 rounded border border-blue-200 font-semibold transition"
                          >
                            +30 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                              setPendingScan((prev) => ({ ...prev, expiryDate: toLocalDateTimeInputValue(target) }));
                            }}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold transition"
                          >
                            +3 Months
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
                              setPendingScan((prev) => ({ ...prev, expiryDate: toLocalDateTimeInputValue(target) }));
                            }}
                            className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-semibold transition"
                          >
                            +6 Months
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                              setPendingScan((prev) => ({ ...prev, expiryDate: toLocalDateTimeInputValue(target) }));
                            }}
                            className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200 font-semibold transition"
                          >
                            +1 Year
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = new Date(Date.now() + 730 * 24 * 60 * 60 * 1000);
                              setPendingScan((prev) => ({ ...prev, expiryDate: toLocalDateTimeInputValue(target) }));
                            }}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 font-semibold transition"
                          >
                            +2 Years (MFG + 24M)
                          </button>
                        </div>
                      </div>

                      {/* One-Tap Confirm & Add Action */}
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setPendingScan(null)}
                          className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition"
                        >
                          Cancel / Scan Again
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-gradient-to-r from-[#0d5f94] to-[#0a4b75] hover:from-[#0b527f] hover:to-[#083a5c] active:scale-[0.98] text-white py-3 px-5 rounded-xl text-xs font-extrabold shadow-lg shadow-[#0d5f94]/25 transition flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          Confirm & Add to Inventory
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 mb-5">
                        {cameraOpen
                          ? "Position barcode or packaging front label inside the viewfinder. The continuous 300ms scanner and Multimodal Vision AI will automatically recognize item details."
                          : "Scan barcode via live camera, upload packaging photos, or use direct barcode lookup above."}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        {!cameraOpen ? (
                          <>
                            <button
                              onClick={handleScan}
                              className="flex-1 bg-[#0d5f94] hover:bg-[#0b527f] active:scale-[0.98] text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm shadow-[#0d5f94]/20"
                            >
                              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                              Open Camera
                            </button>

                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition border border-slate-300 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[18px]">upload_file</span>
                              Upload Photo
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={captureImage}
                              disabled={loading}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">camera</span>
                              {loading ? "Analyzing Packaging..." : "Capture & AI Vision Analyze"}
                            </button>

                            <button
                              onClick={stopCamera}
                              className="bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition border border-slate-300 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                              Close Camera
                            </button>
                          </>
                        )}

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* TAB 2: CUSTOM MANUAL ENTRY FORM */
                <form onSubmit={handleCustomSubmit} className="space-y-3.5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Name & Brand <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunsilk Stunning Black Shine Shampoo, Amul Butter, Dolo 650"
                      value={customForm.name}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        value={customForm.category}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setCustomForm((prev) => ({
                            ...prev,
                            category: newCat,
                            location: getSuggestedStorage(newCat),
                          }));
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Storage Location
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Suggested</span>
                      </div>
                      <select
                        value={customForm.location}
                        onChange={(e) => setCustomForm({ ...customForm, location: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition"
                      >
                        {STORAGE_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Expiry Date & Time <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono">Live calculation</span>
                      </div>
                      <input
                        type="datetime-local"
                        value={customForm.expiryDate}
                        onChange={(e) => setCustomForm({ ...customForm, expiryDate: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition font-mono font-medium"
                      />

                      {customForm.expiryDate && (
                        <div className="mt-1.5 flex items-center justify-between bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${liveStatusPreview.statusColor}`}>
                              {liveStatusPreview.status}
                            </span>
                            <span className="text-[11px] text-slate-700 font-semibold">
                              {liveStatusPreview.expiry}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Preview</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-500 self-center mr-0.5">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setQuickExpiry(30 * 24)}
                          className="text-[10px] bg-blue-50 hover:bg-blue-100 text-[#0d5f94] px-2 py-0.5 rounded-md border border-blue-200 font-semibold transition"
                        >
                          1 Month
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickExpiry(90 * 24)}
                          className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold transition"
                        >
                          3 Months
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickExpiry(180 * 24)}
                          className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 font-semibold transition"
                        >
                          6 Months
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickExpiry(365 * 24)}
                          className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 font-semibold transition"
                        >
                          1 Year
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Manufacturing Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={customForm.mfgDate}
                        onChange={(e) => setCustomForm({ ...customForm, mfgDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Barcode / Batch Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8901030383987 or Batch #B240"
                      value={customForm.barcode}
                      onChange={(e) => setCustomForm({ ...customForm, barcode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0d5f94] hover:bg-[#0b527f] active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-[#0d5f94]/20 mt-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Save to Inventory & Dashboard
                  </button>
                </form>
              )}

              {/* SUCCESS TOAST ALERT */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                    <span className="font-semibold">{successMsg}</span>
                  </div>
                  <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-800">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}

              {/* Result Showcase */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Latest Logged Product
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      loading
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : lastSavedItem
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : productName
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {loading ? "Scanning..." : lastSavedItem ? "Synced to System" : productName ? "Detected" : "Awaiting Entry"}
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  <div>
                    <span className="text-[11px] text-slate-500">Product Name</span>
                    <p className="text-base font-bold text-slate-900">
                      {productName || "No item scanned yet"}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[11px] text-slate-500">Expiry Date</span>
                      <p className="text-sm font-semibold text-[#0d5f94]">
                        {expiryDate || "Awaiting scan..."}
                      </p>
                    </div>
                    {lastSavedItem && (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${lastSavedItem.statusColor}`}>
                        {lastSavedItem.status}
                      </span>
                    )}
                  </div>
                </div>

                {lastSavedItem && (
                  <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                    <Link
                      to="/smartinventory"
                      className="flex-1 text-center bg-white hover:bg-slate-100 text-[#0d5f94] font-semibold text-xs py-2 rounded-lg border border-slate-200 shadow-2xs transition"
                    >
                      View in Inventory →
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex-1 text-center bg-white hover:bg-slate-100 text-[#0d5f94] font-semibold text-xs py-2 rounded-lg border border-slate-200 shadow-2xs transition"
                    >
                      View Dashboard →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <span className="material-symbols-outlined text-amber-500 text-[20px] mb-1">light_mode</span>
                <p className="text-xs font-semibold text-slate-800">Clear Lighting</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Hold bottle label steady to capture brand & expiry stamp.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <span className="material-symbols-outlined text-[#0d5f94] text-[20px] mb-1">crop_free</span>
                <p className="text-xs font-semibold text-slate-800">Fill the Frame</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Works on bottles, cans, boxes, and cosmetics tubes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes scanMove {
            0% {
              top: 0%;
              opacity: 0.8;
            }
            50% {
              opacity: 1;
            }
            100% {
              top: 100%;
              opacity: 0.8;
            }
          }
        `}
      </style>
    </main>
  );
}
