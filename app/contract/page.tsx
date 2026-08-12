"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Rubik, Allura } from "next/font/google";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Download, IdCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Fayda from "@/api/fayda";
import { faydaIdSchema } from "@/lib/schemas/contract";
import {
  AGREEMENT_DESCRIPTION,
  AGREEMENT_TITLE,
  Bullet,
  COMPANY_ADDRESS,
  COMPANY_NAME,
  COMPANY_SIGNATORY_NAME,
  COMPANY_SIGNATORY_TITLE,
  CONTRACT_SECTIONS,
  CONTRACT_VERSION,
  DOC_CODE,
  DOC_HEADER_TITLE,
  DOC_REVISION,
  DOC_TAGLINE,
} from "./contract-content";
import { ContractSignResult, FaydaUser } from "@/types/fayda";
import IdScannerDialog from "./id-scanner-dialog";

const rubik = Rubik({ subsets: ["latin"], weight: "500" });
const signatureFont = Allura({ subsets: ["latin"], weight: "400" });

function formatFaydaId(rawDigits: string) {
  return rawDigits.replace(/(.{4})/g, "$1 ").trim();
}

function DocHeader() {
  return (
    <div className="flex items-start justify-between border-b-2 border-[#ef5325] pb-3 mb-8">
      <div>
        <p className="text-xs text-slate-500 italic">{DOC_CODE}</p>
        <h2 className={`${rubik.className} text-2xl font-bold underline text-slate-900`}>
          {DOC_HEADER_TITLE}
        </h2>
      </div>
      <Image
        src="/src/logo/R&D__Logo_and_Slogan.png"
        alt={COMPANY_NAME}
        width={200}
        height={90}
        className="h-10 w-auto object-contain flex-shrink-0"
      />
    </div>
  );
}

function DocFooter({ page }: { page: number }) {
  return (
    <div className="flex items-end justify-between border-t border-gray-200 mt-10 pt-3">
      <p className="text-xs italic font-bold underline text-slate-500">{DOC_REVISION}</p>
      <p
        className="text-xs font-semibold underline bg-gradient-to-r from-[#3651a2] to-[#ef5325] bg-clip-text text-transparent"
        style={{ textDecorationColor: "#3651a2" }}
      >
        {DOC_TAGLINE}
      </p>
      <p className="text-xs text-slate-500">Page {page} of 4</p>
    </div>
  );
}

function BulletList({ items, className }: { items: Bullet[]; className?: string }) {
  return (
    <ul className={`list-disc pl-5 space-y-2 text-slate-600 leading-relaxed ${className ?? ""}`}>
      {items.map((item, index) => {
        if (typeof item === "string") {
          return <li key={index}>{item}</li>;
        }
        return (
          <li key={index}>
            {item.text}
            <ul className="list-[circle] pl-5 mt-2 space-y-1">
              {item.subBullets.map((sub, subIndex) => (
                <li key={subIndex}>{sub}</li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export default function ContractPage() {
  const [isClient, setIsClient] = useState(false);
  const [rawFaydaId, setRawFaydaId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<FaydaUser | null>(null);
  const [signResult, setSignResult] = useState<ContractSignResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  useEffect(() => setIsClient(true), []);

  const today = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const isFaydaIdComplete = faydaIdSchema.safeParse(rawFaydaId).success;

  const { mutate: sendOtp, isPending: isSendingOtp, error: sendOtpError } =
    Fayda.sendOtp.useMutation({
      onSuccess: (result) => {
        setOtpSent(true);
        setMaskedPhone(result.maskedPhone);
        setDevOtpHint(result.devOtp ?? null);
      },
    });

  const { mutate: verifyOtp, isPending: isVerifyingOtp, error: verifyOtpError } =
    Fayda.verifyOtp.useMutation({
      onSuccess: (user) => setVerifiedUser(user),
    });

  const { mutate: signContract, isPending: isSigning } = Fayda.sign.useMutation({
    onSuccess: (result) => setSignResult(result),
  });

  function resetIdentityFlow() {
    setOtp("");
    setOtpSent(false);
    setMaskedPhone(null);
    setDevOtpHint(null);
    setVerifiedUser(null);
    setAgreed(false);
  }

  function handleFaydaIdChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
    setRawFaydaId(digitsOnly);
    resetIdentityFlow();
  }

  function handleSendOtp() {
    if (!isFaydaIdComplete) return;
    sendOtp(rawFaydaId);
  }

  function handleVerifyOtp() {
    if (!otp) return;
    verifyOtp({ faydaId: rawFaydaId, otp });
  }

  function handleSubmit() {
    if (!verifiedUser || !agreed || !acceptedTerms) return;
    signContract({
      faydaId: verifiedUser.faydaId,
      fullName: verifiedUser.fullName,
      contractVersion: CONTRACT_VERSION,
    });
  }

  async function handleDownloadPdf() {
    if (!contractRef.current || !signResult) return;
    setIsGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(contractRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${signResult.contractNumber.replace(/\//g, "-")}.pdf`);
    } catch (error) {
      console.error("Failed to generate contract PDF", error);
      toast.error("Couldn't generate the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  const readyToSign = !!verifiedUser && agreed && acceptedTerms;
  const workerNameSlot = verifiedUser ? verifiedUser.fullName : "________________________";
  const workerAddressSlot = verifiedUser ? verifiedUser.region ?? "________________________" : "________________________";
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const contractNumberSlot = signResult?.contractNumber ?? `R&D/EOC/InnC/____/${yearSuffix}`;

  return (
    <div className="min-h-screen bg-[#fafbfa] py-12">
      {signResult && (
        <div className="flex items-center justify-center px-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center"
          >
            <div className="mx-auto mb-5 flex items-center justify-center size-16 rounded-full bg-[#3651a2]/10">
              <CheckCircle2 className="size-8 text-[#3651a2]" />
            </div>
            <h1 className={`${rubik.className} text-2xl font-bold text-slate-900 mb-2`}>
              Contract Signed
            </h1>
            <p className="text-slate-600 mb-6">
              Thank you, your agreement has been recorded successfully.
            </p>
            <div className="text-left text-sm bg-[#f6f7f7] rounded-lg p-4 space-y-1">
              <p className="flex justify-between gap-4">
                <span className="text-slate-500">Contract Number</span>
                <span className="font-medium text-slate-900 text-right">{signResult.contractNumber}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-medium text-slate-900">{signResult.referenceId}</span>
              </p>
              <p className="flex justify-between gap-4">
                <span className="text-slate-500">Signed at</span>
                <span className="font-medium text-slate-900">
                  {new Date(signResult.signedAt).toLocaleString()}
                </span>
              </p>
            </div>
            <Button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full mt-6 h-11 bg-[#34a853] hover:bg-[#2c9247] text-white font-medium rounded-lg flex items-center justify-center gap-2"
            >
              {isGeneratingPdf ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Download as PDF
            </Button>
          </motion.div>
        </div>
      )}

      <div
        className={signResult ? "absolute -left-[9999px] top-0" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"}
        style={signResult ? { width: "896px" } : undefined}
        aria-hidden={signResult ? true : undefined}
      >
        <motion.div
          ref={contractRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isClient ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10"
        >
          <DocHeader />

          <h1 className={`${rubik.className} text-xl md:text-2xl font-bold underline text-center text-slate-900 mb-2`}>
            {AGREEMENT_TITLE}
          </h1>

          <p className="text-center text-sm text-slate-500 italic mb-6">
            {AGREEMENT_DESCRIPTION}
          </p>

          <div className="text-sm mb-6 space-y-1">
            <p>
              <span className="font-semibold underline">Date:</span> {today}
            </p>
            <p>
              <span className="font-semibold underline">Contract Number:</span> {contractNumberSlot}
            </p>
          </div>

          <p className="text-slate-600 leading-relaxed mb-10">
            This Task-Based Data annotation Worker Agreement ("Agreement") is made and entered
            into as of {today}, by and between:
            <br />
            <span className="font-semibold underline">{COMPANY_NAME}</span> ({" "}
            <span className="italic">R&D Group</span> ) (hereinafter referred to as the
            "Company"), having its principal office at {COMPANY_ADDRESS}
            <br />
            and
            <br />
            <span className={verifiedUser ? "italic font-serif font-bold underline" : ""}>
              {workerNameSlot}
            </span>{" "}
            (hereinafter referred to as the "Data annotation Worker"), residing at{" "}
            <span className={verifiedUser ? "font-bold underline" : ""}>{workerAddressSlot}</span>
            . Collectively referred to as the "Parties", and individually as a "Party."
          </p>

          {CONTRACT_SECTIONS.map((section) => (
            <div key={section.id} className="mb-8">
              <h2 className={`${rubik.className} text-lg font-bold underline text-slate-900 mb-3`}>
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p key={index} className="text-slate-600 leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
              {section.table && (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-[#f6f7f7]">
                      <tr>
                        {section.table.headers.map((header) => (
                          <th
                            key={header}
                            className="text-left font-semibold underline text-slate-700 px-3 py-2 border-b border-gray-200"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-gray-100">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-slate-600 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.bullets && <BulletList items={section.bullets} />}
            </div>
          ))}

          {/* Signature block */}
          <div className="grid sm:grid-cols-2 gap-8 mt-10 pt-8 border-t border-gray-200">
            <div>
              <p className="font-semibold underline text-slate-900 mb-4">FOR AND ON BEHALF OF THE COMPANY:</p>
              <div className="space-y-3 text-sm text-slate-600">
                <p className="border-b border-slate-300 pb-1">
                  Name:{" "}
                  <span className={readyToSign ? "font-bold underline text-slate-900" : ""}>
                    {readyToSign ? COMPANY_SIGNATORY_NAME : "________________________"}
                  </span>
                </p>
                <p className="border-b border-slate-300 pb-1">
                  Title:{" "}
                  <span className={readyToSign ? "font-bold underline text-slate-900" : ""}>
                    {readyToSign ? COMPANY_SIGNATORY_TITLE : "________________________"}
                  </span>
                </p>
                <p className="border-b border-slate-300 pb-1 flex items-end min-h-[2rem]">
                  Signature:&nbsp;
                  {readyToSign ? (
                    <span className={`${signatureFont.className} text-4xl leading-none text-black`}>
                      {COMPANY_SIGNATORY_NAME}
                    </span>
                  ) : (
                    <span>________________________</span>
                  )}
                </p>
                <p className="border-b border-slate-300 pb-1">
                  Date:{" "}
                  {readyToSign ? (
                    <span className="font-bold underline">{today}</span>
                  ) : (
                    "________________________"
                  )}
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold underline text-slate-900 mb-4">FOR AND ON BEHALF OF THE WORKER:</p>
              <div className="space-y-3 text-sm text-slate-600">
                <p className="border-b border-slate-300 pb-1">
                  Full name:{" "}
                  <span className={verifiedUser ? "font-bold underline text-slate-900" : ""}>
                    {workerNameSlot}
                  </span>
                </p>
                <p className="border-b border-slate-300 pb-1 flex items-end min-h-[2rem]">
                  Signature:&nbsp;
                  {readyToSign ? (
                    <span className={`${signatureFont.className} text-4xl leading-none text-black`}>
                      {verifiedUser!.fullName}
                    </span>
                  ) : (
                    <span>________________________</span>
                  )}
                </p>
                <p className="border-b border-slate-300 pb-1">
                  Date:{" "}
                  {readyToSign ? (
                    <span className="font-bold underline">{today}</span>
                  ) : (
                    "________________________"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Identity verification */}
          {!signResult && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Image
                src="/src/logo/fayda.png"
                alt="Fayda"
                width={40}
                height={40}
                className="h-10 w-10 object-contain flex-shrink-0"
              />
              <h2 className={`${rubik.className} text-lg font-bold text-slate-900`}>
                Verify Your Identity to Sign
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-2">
              Enter your 16-digit Fayda ID, confirm the code sent to your phone, and we'll
              complete the signature fields above.
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-[#34a853]/30 bg-[#34a853]/10 px-3 py-2.5 mb-4">
              <ShieldCheck className="size-4 text-[#34a853] mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-slate-700">
                We only use your Fayda ID to verify your identity for this Agreement — your
                data is kept safe and is never shared with third parties.
              </p>
            </div>

            <div className="max-w-sm">
              <label className="block text-sm font-medium mb-1 text-slate-700">
                Fayda ID (16 digits) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-start gap-2">
                <div className="relative flex-1">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#3651a2]" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={formatFaydaId(rawFaydaId)}
                    onChange={(e) => handleFaydaIdChange(e.target.value)}
                    disabled={isSendingOtp || otpSent}
                    className={`w-full bg-[#f6f7f7] rounded-md pl-10 pr-4 py-2 tracking-widest font-mono outline-none ${
                      sendOtpError ? "border-2 border-red-500" : ""
                    } ${isSendingOtp || otpSent ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                </div>
                <IdScannerDialog
                  onDigitsDetected={handleFaydaIdChange}
                  disabled={isSendingOtp || otpSent}
                />
              </div>
              {sendOtpError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3.5" />
                  {sendOtpError.message}
                </p>
              )}

              {!otpSent && (
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!isFaydaIdComplete || isSendingOtp}
                  className="w-full mt-3 h-10 bg-[#3651a2] hover:bg-[#2c4585] text-white font-medium rounded-lg flex items-center justify-center gap-2"
                >
                  {isSendingOtp && <Loader2 className="size-4 animate-spin" />}
                  Send Verification Code
                </Button>
              )}

              {otpSent && !verifiedUser && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Verification Code {maskedPhone ? `(sent to ${maskedPhone})` : ""}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isVerifyingOtp}
                    className={`w-full bg-[#f6f7f7] rounded-md px-4 py-2 tracking-widest font-mono outline-none ${
                      verifyOtpError ? "border-2 border-red-500" : ""
                    } ${isVerifyingOtp ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {devOtpHint && (
                    <p className="text-xs text-amber-600 mt-1">
                      Dev mode (no SMS gateway yet): code is {devOtpHint}
                    </p>
                  )}
                  {verifyOtpError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="size-3.5" />
                      {verifyOtpError.message}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otp.length < 4 || isVerifyingOtp}
                      className="h-10 px-6 bg-[#3651a2] hover:bg-[#2c4585] text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >
                      {isVerifyingOtp && <Loader2 className="size-4 animate-spin" />}
                      Verify Code
                    </Button>
                    <button
                      type="button"
                      onClick={resetIdentityFlow}
                      className="text-sm text-slate-500 hover:text-slate-700 underline"
                    >
                      Change number
                    </button>
                  </div>
                </div>
              )}

              {verifiedUser && (
                <p className="text-xs text-[#3651a2] mt-3 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" />
                  Identity verified via Fayda
                  <button
                    type="button"
                    onClick={resetIdentityFlow}
                    className="ml-2 text-slate-500 hover:text-slate-700 underline"
                  >
                    Not you?
                  </button>
                </p>
              )}
            </div>

            <div className="mt-6 flex items-start gap-2">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                disabled={!verifiedUser}
                className="mt-0.5 data-[state=checked]:bg-[#3651a2] data-[state=checked]:border-[#3651a2]"
              />
              <label htmlFor="agree" className="text-sm text-slate-600">
                I, {verifiedUser ? verifiedUser.fullName : "the Fayda ID holder above"}, have
                read and agree to the terms of this Agreement.
              </label>
            </div>

            <div className="mt-3 flex items-start gap-2">
              <Checkbox
                id="acceptedTerms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5 data-[state=checked]:bg-[#3651a2] data-[state=checked]:border-[#3651a2]"
              />
              <label htmlFor="acceptedTerms" className="text-sm text-slate-600">
                I have read and agree to R&D's{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#3651a2] underline underline-offset-2 hover:text-[#2c4585]"
                >
                  Terms and Conditions
                </Link>
                .
              </label>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!verifiedUser || !agreed || !acceptedTerms || isSigning}
              className="w-full sm:w-auto mt-6 h-11 px-8 bg-[#3651a2] hover:bg-[#2c4585] text-white font-medium rounded-lg flex items-center justify-center gap-2"
            >
              {isSigning && <Loader2 className="size-4 animate-spin" />}
              Sign & Submit Contract
            </Button>
          </div>
          )}

          <DocFooter page={4} />
        </motion.div>
      </div>
    </div>
  );
}
