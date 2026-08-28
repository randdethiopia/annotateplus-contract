import { forwardRef } from "react";
import { BrandLogo } from "@/components/branding/brand-logo";
import { Rubik, Allura } from "next/font/google";
import { formatAgreementDate } from "@/lib/format-date";
import {
  AGREEMENT_DESCRIPTION,
  AGREEMENT_TITLE,
  Bullet,
  COMPANY_ADDRESS,
  COMPANY_NAME,
  COMPANY_SIGNATORY_NAME,
  COMPANY_SIGNATORY_TITLE,
  CONTRACT_SECTIONS,
  DOC_CODE,
  DOC_HEADER_TITLE,
  DOC_REVISION,
  DOC_TAGLINE,
} from "@/lib/contract-content";

const rubik = Rubik({ subsets: ["latin"], weight: "500" });
const signatureFont = Allura({ subsets: ["latin"], weight: "400" });

function DocHeader() {
  return (
    <div className="flex items-start justify-between border-b-2 border-[#ef5325] pb-3 mb-8">
      <div>
        <p className="text-xs text-slate-500 italic">{DOC_CODE}</p>
        <h2 className={`${rubik.className} text-2xl font-bold underline text-slate-900`}>
          {DOC_HEADER_TITLE}
        </h2>
      </div>
      <BrandLogo className="h-10" width={200} height={48} />
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

export interface ContractDocumentProps {
  contractNumber: string;
  workerName: string;
  signed: boolean;
  agreementDate?: string;
  signedDate?: string;
}

export const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  function ContractDocument(
    { contractNumber, workerName, signed, agreementDate, signedDate },
    ref
  ) {
    const displayDate = formatAgreementDate(
      agreementDate ?? signedDate ?? new Date().toISOString()
    );
    const dateLabel = signedDate ? formatAgreementDate(signedDate) : displayDate;

    return (
      <div
        ref={ref}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8 lg:p-10"
      >
        <DocHeader />

        <h1 className={`${rubik.className} text-xl md:text-2xl font-bold underline text-center text-slate-900 mb-2`}>
          {AGREEMENT_TITLE}
        </h1>

        <p className="text-center text-sm text-slate-500 italic mb-6">{AGREEMENT_DESCRIPTION}</p>

        <div className="text-sm mb-6 space-y-1">
          <p>
            <span className="font-semibold underline">Date:</span> {displayDate}
          </p>
          <p>
            <span className="font-semibold underline">Contract Number:</span> {contractNumber}
          </p>
        </div>

        <p className="text-slate-600 leading-relaxed mb-10">
          This Task-Based Data annotation Worker Agreement (&quot;Agreement&quot;) is made and
          entered into as of {displayDate}, by and between:
          <br />
          <span className="font-semibold underline">{COMPANY_NAME}</span> (
          <span className="italic">R&D Group</span>) (hereinafter referred to as the
          &quot;Company&quot;), having its principal office at {COMPANY_ADDRESS}
          <br />
          and
          <br />
          <span className="italic font-serif font-bold underline">{workerName}</span>{" "}
          (hereinafter referred to as the &quot;Data annotation Worker&quot;). Collectively
          referred to as the &quot;Parties&quot;, and individually as a &quot;Party.&quot;
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

        <div className="grid sm:grid-cols-2 gap-8 mt-10 pt-8 border-t border-gray-200">
          <div>
            <p className="font-semibold underline text-slate-900 mb-4">
              FOR AND ON BEHALF OF THE COMPANY:
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="border-b border-slate-300 pb-1">
                Name:{" "}
                <span className={signed ? "font-bold underline text-slate-900" : ""}>
                  {signed ? COMPANY_SIGNATORY_NAME : "________________________"}
                </span>
              </p>
              <p className="border-b border-slate-300 pb-1">
                Title:{" "}
                <span className={signed ? "font-bold underline text-slate-900" : ""}>
                  {signed ? COMPANY_SIGNATORY_TITLE : "________________________"}
                </span>
              </p>
              <p className="border-b border-slate-300 pb-1 flex items-end min-h-[2rem]">
                Signature:&nbsp;
                {signed ? (
                  <span className={`${signatureFont.className} text-4xl leading-none text-black`}>
                    {COMPANY_SIGNATORY_NAME}
                  </span>
                ) : (
                  <span>________________________</span>
                )}
              </p>
              <p className="border-b border-slate-300 pb-1">
                Date: {signed ? <span className="font-bold underline">{dateLabel}</span> : "________________________"}
              </p>
            </div>
          </div>

          <div>
            <p className="font-semibold underline text-slate-900 mb-4">
              FOR AND ON BEHALF OF THE WORKER:
            </p>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="border-b border-slate-300 pb-1">
                Full name: <span className="font-bold underline text-slate-900">{workerName}</span>
              </p>
              <p className="border-b border-slate-300 pb-1 flex items-end min-h-[2rem]">
                Signature:&nbsp;
                {signed ? (
                  <span className={`${signatureFont.className} text-4xl leading-none text-black`}>
                    {workerName}
                  </span>
                ) : (
                  <span>________________________</span>
                )}
              </p>
              <p className="border-b border-slate-300 pb-1">
                Date: {signed ? <span className="font-bold underline">{dateLabel}</span> : "________________________"}
              </p>
            </div>
          </div>
        </div>

        {signed && (
          <p className="mt-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center text-sm font-semibold text-green-800">
            This contract has been signed digitally and verified by R&amp;D&apos;s e-signature system.
          </p>
        )}

        <DocFooter page={4} />
      </div>
    );
  }
);
