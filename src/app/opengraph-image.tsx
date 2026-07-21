import { ImageResponse } from "next/og";
import { getSiteSettings } from "@/server/services/site-settings";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.description;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const settingsResult = await getSiteSettings();
  const name = settingsResult.success
    ? settingsResult.data.instituteName
    : siteConfig.name;
  const description =
    settingsResult.success && settingsResult.data.defaultDescription
      ? settingsResult.data.defaultDescription
      : siteConfig.description;

  return new ImageResponse(
    <div tw="w-full h-full flex relative overflow-hidden bg-[#f8f5ee] text-[#1f2933] font-sans">
      <div tw="absolute inset-0 bg-gradient-to-br from-[#f8f5ee] via-[#eff6f1] to-[#e7eef7]" />
      <div tw="absolute top-0 right-0 w-[420px] h-[630px] bg-[#153f32]" />
      <div tw="absolute top-[68px] right-[78px] w-[280px] h-[280px] border-2 border-white/20 rounded-full" />
      <div tw="absolute right-[104px] bottom-[76px] flex flex-col gap-[18px]">
        {[0, 1, 2].map((index) => (
          <div key={index} tw="w-[236px] h-[18px] rounded-full bg-white/20" />
        ))}
      </div>
      <div tw="absolute left-[72px] top-[72px] right-[492px] bottom-[72px] flex flex-col justify-between">
        <div tw="flex items-center gap-4 text-[24px] font-bold text-[#315b4c]">
          <div tw="w-12 h-12 rounded-[14px] bg-[#153f32] text-[#f8f5ee] flex items-center justify-center text-[26px] font-extrabold">
            SP
          </div>
          Coaching Institute
        </div>
        <div tw="flex flex-col">
          <div tw="text-[88px] leading-[0.95] font-extrabold tracking-normal text-[#18231f] mb-7">
            {name}
          </div>
          <div tw="w-24 h-2 rounded-full bg-[#d7a84f] mb-7" />
          <div tw="text-[34px] leading-[1.28] text-[#4b5a54] max-w-[620px]">
            {description}
          </div>
        </div>
        <div tw="flex gap-[14px]">
          {["Classes IX-XII", "Structured Learning", "Personal Guidance"].map((item) => (
            <div
              key={item}
              tw="border border-[#153f32]/20 rounded-full px-[18px] py-3 text-[20px] font-semibold text-[#315b4c] bg-white/55"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <div tw="absolute right-[72px] top-[168px] w-[324px] h-[286px] rounded-[32px] bg-[#f8f5ee] flex flex-col justify-center p-[34px] shadow-2xl">
        <div tw="text-[22px] text-[#315b4c] font-bold mb-[22px]">Focus Areas</div>
        {["Clear concepts", "Regular practice", "Steady progress"].map((item) => (
          <div key={item} tw="flex items-center gap-3 text-[26px] text-[#24332d] mb-4">
            <div tw="w-[13px] h-[13px] rounded-full bg-[#d7a84f]" />
            {item}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
