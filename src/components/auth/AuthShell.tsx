import type { ReactNode } from 'react';
import {
  ArrowLeft,
  AudioLines,
  Hand,
  Languages,
  MessageCircleHeart,
  ScanLine,
  Sparkles,
} from 'lucide-react';

type AuthShellProps = {
  children: ReactNode;
  title: string;
  highlight?: string;
  description?: string;
  subtitle?: string;
  backTo?: string | null;
  backLabel?: string;
};

function SignifyMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16.5 12.5v11.25M22 9.5v14.25M27.5 11v12.75M33 15v10.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <path
        d="M16.5 23.75 13 20.5c-1.8-1.65-4.5-.1-3.75 2.2l3.4 10.15A9.5 9.5 0 0 0 21.65 39H27a10 10 0 0 0 10-10v-5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M34.5 7.5v4M32.5 9.5h4M39 12.5v3M37.5 14h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AuthDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#e8e3f1]" />

      <div className="absolute -right-28 -top-24 h-[360px] w-[360px] rounded-full bg-[#c9e2d9] opacity-90" />

      <div className="absolute -bottom-36 -left-28 h-[420px] w-[420px] rounded-full bg-[#efc8bb] opacity-80" />

      <div className="absolute left-[12%] top-[11%] h-28 w-28 rotate-12 rounded-[32px] bg-[#f3d88b] opacity-80" />

      <div className="absolute bottom-[9%] right-[10%] h-32 w-32 -rotate-12 rounded-[36px] bg-[#c8d5eb] opacity-90" />

      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            'radial-gradient(circle, #514c68 1.25px, transparent 1.25px)',
          backgroundSize: '25px 25px',
        }}
      />

      {/* Icon nhận diện ngôn ngữ ký hiệu */}
      <div className="absolute right-[10%] top-[16%] animate-[signifyFloat_6s_ease-in-out_infinite]">
        <div className="flex h-[86px] w-[86px] rotate-6 items-center justify-center rounded-[26px] border border-white/80 bg-[#fffaf3]/90 shadow-[0_18px_40px_rgba(76,68,96,0.13)] backdrop-blur-sm">
          <SignifyMark className="h-11 w-11 text-[#b46f59]" />
        </div>
      </div>

      {/* Icon hội thoại */}
      <div className="absolute bottom-[14%] left-[9%] animate-[signifyFloatReverse_7s_ease-in-out_infinite]">
        <div className="flex h-[68px] w-[68px] -rotate-6 items-center justify-center rounded-[22px] border border-white/80 bg-[#fffaf5]/90 shadow-[0_16px_34px_rgba(76,68,96,0.12)] backdrop-blur-sm">
          <MessageCircleHeart
            className="h-8 w-8 text-[#8f6688]"
            strokeWidth={1.7}
          />
        </div>
      </div>

      {/* Icon chuyển đổi ngôn ngữ */}
      <div className="absolute bottom-[27%] right-[7%] animate-[signifyFloat_8s_ease-in-out_infinite_1s]">
        <div className="flex h-[60px] w-[60px] rotate-6 items-center justify-center rounded-[20px] border border-white/75 bg-[#f8fcfa]/90 shadow-[0_14px_30px_rgba(76,68,96,0.11)] backdrop-blur-sm">
          <Languages
            className="h-7 w-7 text-[#4f8177]"
            strokeWidth={1.7}
          />
        </div>
      </div>

      <Sparkles
        className="absolute left-[8%] top-[31%] h-7 w-7 animate-pulse text-[#9a7294]"
        strokeWidth={1.6}
      />

      <AudioLines
        className="absolute bottom-[7%] right-[26%] h-8 w-8 text-[#668f86]"
        strokeWidth={1.6}
      />

      <style>{`
        @keyframes signifyFloat {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }

        @keyframes signifyFloatReverse {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(10px) rotate(-2deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*="signifyFloat"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function RecognitionIllustration() {
  const waveHeights = [12, 21, 16, 29, 20, 33, 17, 25, 13];

  return (
    <div className="mb-10 rounded-[30px] border border-white/75 bg-white/50 p-6 shadow-[0_24px_60px_rgba(64,91,83,0.13)] backdrop-blur-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#efb8a7]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f1d58b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#9bcabb]" />
        </div>

        <div className="flex items-center gap-2 rounded-full bg-[#d8ebe5] px-3 py-1.5 text-[11px] font-semibold text-[#32665e]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4e9c8d]" />
          Đang nhận diện
        </div>
      </div>

      <div className="grid grid-cols-[150px_1fr] gap-4">
        {/* Khối nhận diện bàn tay */}
        <div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#f3dcd3]">
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/70 bg-white/75 px-2.5 py-1 text-[10px] font-semibold text-[#795d55]">
            <ScanLine className="h-3 w-3" strokeWidth={1.8} />
            Ký hiệu
          </div>

          <div className="relative flex h-[92px] w-[92px] items-center justify-center">
            <span className="absolute h-[92px] w-[92px] animate-[signifyRadar_3s_ease-out_infinite] rounded-full border border-[#c77b64]/35" />

            <span className="absolute h-[70px] w-[70px] rounded-full bg-[#fff8f3]/85" />

            <SignifyMark className="relative z-10 h-12 w-12 animate-[signifyHandMove_3.8s_ease-in-out_infinite] text-[#b8644e]" />
          </div>

          <div className="absolute bottom-4 left-5 right-5 h-1.5 overflow-hidden rounded-full bg-white/65">
            <div className="h-full animate-[signifyScan_3.8s_ease-in-out_infinite] rounded-full bg-[#c77962]" />
          </div>
        </div>

        {/* Khối văn bản đã chuyển đổi */}
        <div className="flex min-h-48 flex-col justify-between rounded-2xl border border-white/75 bg-[#fffdf9]/90 p-5">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-primary-light text-brand-primary">
                A
              </span>

              Văn bản
            </div>

            <p className="text-xl font-semibold leading-snug tracking-[-0.025em] text-brand-text">
              Xin chào, rất vui được kết nối với bạn.
            </p>
          </div>

          <div className="flex h-9 items-end gap-1">
            {waveHeights.map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-1.5 origin-bottom animate-[signifyWave_1.4s_ease-in-out_infinite] rounded-full bg-brand-primary/70"
                style={{
                  height,
                  animationDelay: `${index * 110}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes signifyHandMove {
          0%, 100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes signifyRadar {
          0% {
            transform: scale(0.75);
            opacity: 0.8;
          }

          100% {
            transform: scale(1.25);
            opacity: 0;
          }
        }

        @keyframes signifyScan {
          0%, 100% {
            width: 24%;
          }

          50% {
            width: 100%;
          }
        }

        @keyframes signifyWave {
          0%, 100% {
            transform: scaleY(0.55);
            opacity: 0.5;
          }

          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [class*="signifyHandMove"],
          [class*="signifyRadar"],
          [class*="signifyScan"],
          [class*="signifyWave"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AuthShell({
  children,
  title,
  highlight,
  description,
  subtitle,
  backTo = '/',
  backLabel = 'Quay lại',
}: AuthShellProps) {
  const supportingText = description ?? subtitle;

  return (
    <main className="min-h-screen bg-brand-bg">
      <div className="grid min-h-screen lg:grid-cols-[42%_58%]">
        {/* Khu vực giới thiệu */}
        <aside className="relative hidden min-h-screen overflow-hidden border-r border-[#bfd3cc] bg-[#dfece7] px-12 py-9 text-brand-text lg:flex lg:flex-col">
          <div className="absolute -left-28 bottom-16 h-72 w-72 rounded-full bg-[#c8ded6]/70" />

          <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[#f0cfc3]/65" />

          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'radial-gradient(circle, #365f58 1.2px, transparent 1.2px)',
              backgroundSize: '27px 27px',
            }}
          />

          {/* Thương hiệu */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-[0_10px_25px_rgba(63,124,114,0.22)]">
              <SignifyMark className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xl font-bold tracking-[-0.03em] text-brand-text">
                Signify
              </p>

              <p className="text-xs font-medium text-brand-muted">
                Kết nối bằng sự thấu hiểu
              </p>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-[510px]">
            <RecognitionIllustration />

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary">
              Giao tiếp không còn khoảng cách
            </p>

            <h2 className="max-w-[480px] text-[42px] font-bold leading-[1.1] tracking-[-0.045em] text-brand-text">
              Để mỗi cuộc trò chuyện đều được lắng nghe.
            </h2>

            <p className="mt-5 max-w-[470px] text-base leading-7 text-brand-muted">
              Signify hỗ trợ chuyển đổi ngôn ngữ ký hiệu và lời nói, giúp mọi
              người giao tiếp tự nhiên, gần gũi và dễ dàng hơn.
            </p>
          </div>

          <p className="relative z-10 text-xs leading-5 text-brand-muted">
            Một sản phẩm công nghệ vì cộng đồng.
          </p>
        </aside>

        {/* Khu vực biểu mẫu */}
        <section
          className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8 lg:px-12"
          style={{
            background:
              'linear-gradient(135deg, #e8e3f1 0%, #e2e8ef 52%, #d9e9e4 100%)',
          }}
        >
          <AuthDecorations />

          <div className="relative z-10 w-full max-w-[500px]">
            {backTo && (
              <a
                href={backTo}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-muted transition-colors hover:text-brand-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </a>
            )}

            <div className="rounded-2xl border border-[#d6d0df] bg-[#fffcf8] p-7 shadow-[0_22px_55px_rgba(67,63,88,0.16)] sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex items-center gap-3 lg:hidden">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white">
                    <SignifyMark className="h-6 w-6" />
                  </div>

                  <span className="text-xl font-bold tracking-[-0.03em] text-brand-text">
                    Signify
                  </span>
                </div>

               <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] text-brand-text">
  {title}{' '}
  {highlight && (
    <span className="text-brand-primary">{highlight}</span>
  )}
</h1>

                {supportingText && (
                  <p className="mt-2 text-sm leading-6 text-brand-muted">
                    {supportingText}
                  </p>
                )}
              </div>

              {children}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-[#665f73]">
              Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính
              sách bảo mật của Signify.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}