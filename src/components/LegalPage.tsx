import { ArrowLeft, ShieldCheck, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

type LegalPageProps = { kind: 'terms' | 'privacy' };

const sections = {
  terms: {
    title: 'Điều khoản dịch vụ',
    intro: 'Điều khoản này mô tả cách bạn sử dụng Signify, nền tảng hỗ trợ giao tiếp giữa người dùng ngôn ngữ ký hiệu và người dùng ngôn ngữ nói.',
    items: [
      ['1. Chấp nhận điều khoản', 'Khi tạo tài khoản hoặc sử dụng Signify, bạn xác nhận đã đọc và đồng ý với Điều khoản này cùng Chính sách bảo mật. Nếu không đồng ý, vui lòng không tạo tài khoản. Nếu bạn chưa đủ tuổi tự mình chấp thuận theo quy định áp dụng, bạn cần có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp.'],
      ['2. Tài khoản và bảo mật', 'Bạn cần cung cấp thông tin chính xác, giữ bí mật thông tin đăng nhập và chịu trách nhiệm về hoạt động phát sinh từ tài khoản của mình. Hãy thông báo cho Signify khi nghi ngờ tài khoản bị truy cập trái phép. Không chia sẻ mật khẩu hoặc mã xác thực cho người khác.'],
      ['3. Sử dụng phù hợp', 'Bạn đồng ý không sử dụng dịch vụ để vi phạm pháp luật, xâm phạm quyền của người khác, quấy rối, lừa đảo, phát tán mã độc, gây gián đoạn hệ thống hoặc cố truy cập trái phép. Bạn cần có quyền cần thiết đối với nội dung, hình ảnh, video và âm thanh mà bạn tải lên hoặc truyền qua dịch vụ.'],
      ['4. Tính chất của tính năng AI', 'Các tính năng nhận diện, chuyển đổi hoặc tạo nội dung bằng AI có thể sai, thiếu ngữ cảnh hoặc không phù hợp với một tình huống cụ thể. Signify hỗ trợ giao tiếp nhưng không thay thế phiên dịch viên chuyên nghiệp, tư vấn y tế, pháp lý hoặc quyết định của con người. Hãy kiểm tra nội dung quan trọng trước khi dựa vào đó.'],
      ['5. Dữ liệu dùng để cải thiện AI', 'Signify chỉ sử dụng nội dung của bạn cho hoạt động huấn luyện hoặc cải thiện mô hình AI khi bạn đã đưa ra lựa chọn đồng ý riêng, tự nguyện và có thể rút lại. Việc từ chối không làm mất quyền sử dụng các tính năng cốt lõi, trừ tính năng mà dữ liệu đó là cần thiết để vận hành. Chi tiết về dữ liệu, thời hạn lưu giữ, cách rút lại và giới hạn xóa khỏi mô hình được mô tả trong Chính sách bảo mật.'],
      ['6. Quyền đối với nội dung', 'Bạn vẫn giữ quyền đối với nội dung do mình tạo. Trong phạm vi cần thiết để cung cấp tính năng bạn yêu cầu, bạn cấp cho Signify quyền xử lý nội dung đó theo Chính sách bảo mật. Việc đồng ý dùng dữ liệu cho AI phải được thực hiện riêng, không phát sinh chỉ từ việc bạn sử dụng dịch vụ.'],
      ['7. Tính sẵn sàng và thay đổi', 'Signify có thể cập nhật, tạm ngừng hoặc thay đổi tính năng để bảo trì, bảo mật hoặc cải thiện dịch vụ. Chúng tôi sẽ thông báo những thay đổi quan trọng của Điều khoản theo cách phù hợp. Các quyền bắt buộc của bạn theo pháp luật vẫn được bảo lưu.'],
      ['8. Chấm dứt sử dụng', 'Bạn có thể ngừng sử dụng và yêu cầu đóng tài khoản theo kênh hỗ trợ của Signify. Signify có thể hạn chế hoặc tạm ngừng tài khoản khi cần bảo vệ dịch vụ, người dùng khác hoặc tuân thủ pháp luật; chúng tôi sẽ thông báo lý do trong phạm vi được phép.'],
      ['9. Liên hệ và luật áp dụng', 'Nếu có câu hỏi hoặc khiếu nại, liên hệ Signify qua địa chỉ hỗ trợ được công bố trong ứng dụng. Điều khoản được áp dụng cùng pháp luật Việt Nam và không loại trừ quyền của người tiêu dùng theo quy định bắt buộc.'],
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật',
    intro: 'Chính sách này giải thích dữ liệu Signify xử lý, mục đích sử dụng và các lựa chọn của bạn. Signify cần hoàn thiện thông tin liên hệ, nhà cung cấp và thời hạn lưu giữ trước khi phát hành chính thức.',
    items: [
      ['1. Dữ liệu có thể được xử lý', 'Tùy tính năng bạn sử dụng, dữ liệu có thể gồm thông tin tài khoản (tên đăng nhập, họ tên, email), thông tin hồ sơ bạn tự cung cấp, ảnh đại diện, nội dung trò chuyện, hình ảnh/video bàn tay, âm thanh/giọng nói, bản chuyển đổi văn bản, dữ liệu cuộc gọi và thông tin kỹ thuật như thiết bị, nhật ký lỗi, thời điểm truy cập. Không gửi dữ liệu nhạy cảm nếu không cần thiết.'],
      ['2. Mục đích sử dụng', 'Dữ liệu được dùng để tạo và bảo vệ tài khoản; cung cấp trò chuyện, cuộc gọi và tính năng chuyển đổi; gửi mã xác minh; hỗ trợ khách hàng; phát hiện lạm dụng, khắc phục sự cố và đáp ứng nghĩa vụ pháp lý. Dữ liệu không được dùng cho mục đích mới không tương thích nếu chưa có căn cứ phù hợp và thông báo cần thiết.'],
      ['3. Lựa chọn riêng cho huấn luyện AI', 'Nếu Signify triển khai chương trình cải thiện AI bằng dữ liệu người dùng, chúng tôi sẽ xin đồng ý riêng trước khi đưa dữ liệu vào chương trình. Có thể bao gồm video/ảnh ký hiệu, âm thanh, bản chép lời, bản dịch hoặc phản hồi gắn với ví dụ đó. Từ chối không ảnh hưởng việc tạo tài khoản hay các tính năng không phụ thuộc vào dữ liệu huấn luyện. Bạn có thể thay đổi lựa chọn hoặc rút lại qua phần Cài đặt quyền riêng tư hoặc liên hệ Signify.'],
      ['4. Giảm nhận dạng và giới hạn thực tế', 'Trước khi dùng cho huấn luyện, Signify sẽ áp dụng biện pháp giảm nhận dạng phù hợp như loại bỏ thông tin tài khoản khỏi bộ dữ liệu và hạn chế truy cập. Dữ liệu đã khử nhận dạng vẫn có thể chứa dấu hiệu nhận biết trong hình ảnh, giọng nói hoặc nội dung. Sau khi một mô hình đã được huấn luyện, việc xóa hoàn toàn ảnh hưởng của một mẫu cụ thể có thể không khả thi; khi nhận yêu cầu rút lại, Signify sẽ dừng sử dụng dữ liệu đó trong các đợt huấn luyện tiếp theo và xử lý các bản dữ liệu còn kiểm soát được theo quy định áp dụng.'],
      ['5. Chia sẻ và nhà cung cấp', 'Signify có thể chia sẻ dữ liệu tối thiểu cần thiết với nhà cung cấp hạ tầng, lưu trữ, gửi email, phân tích bảo mật hoặc xử lý AI để họ cung cấp dịch vụ theo chỉ dẫn và nghĩa vụ bảo mật. Signify không bán dữ liệu cá nhân. Nếu cần chuyển dữ liệu ra ngoài Việt Nam hoặc chia sẻ với bên khác cho mục đích riêng, chúng tôi sẽ thông báo và thực hiện các thủ tục, căn cứ cần thiết theo pháp luật. Danh sách nhà cung cấp thực tế cần được Signify công bố trước khi phát hành.'],
      ['6. Thời hạn lưu giữ và bảo mật', 'Dữ liệu được lưu trong thời gian cần thiết cho mục đích đã nêu, duy trì tài khoản, giải quyết tranh chấp và tuân thủ pháp luật. Khi hết nhu cầu, dữ liệu sẽ được xóa hoặc khử nhận dạng theo quy trình áp dụng, trừ trường hợp phải lưu giữ theo quy định. Signify áp dụng biện pháp kỹ thuật và tổ chức phù hợp; không có hệ thống truyền hoặc lưu trữ nào bảo đảm an toàn tuyệt đối. Thời hạn cụ thể theo từng loại dữ liệu cần được Signify xác nhận và công bố.'],
      ['7. Quyền và yêu cầu của bạn', 'Theo pháp luật áp dụng, bạn có thể yêu cầu biết, truy cập, cập nhật, rút lại sự đồng ý, hạn chế hoặc phản đối xử lý, xóa dữ liệu, phản ánh/khiếu nại và yêu cầu hỗ trợ. Một số yêu cầu có thể bị giới hạn khi Signify có nghĩa vụ pháp lý phải tiếp tục xử lý. Chúng tôi sẽ xác minh danh tính và phản hồi trong thời hạn theo quy định.'],
      ['8. Trẻ em và người đại diện', 'Dịch vụ không hướng tới việc thu thập dữ liệu trẻ em khi chưa có căn cứ và sự đồng ý phù hợp. Nếu bạn là cha mẹ/người giám hộ và cho rằng trẻ đã cung cấp dữ liệu không phù hợp, vui lòng liên hệ Signify để được hỗ trợ.'],
      ['9. Cập nhật và liên hệ', 'Khi Chính sách thay đổi đáng kể, Signify sẽ cập nhật ngày hiệu lực và thông báo phù hợp. Đơn vị kiểm soát dữ liệu, địa chỉ liên hệ quyền riêng tư, email tiếp nhận yêu cầu và thời hạn lưu giữ cụ thể phải được Signify bổ sung trước khi đưa dịch vụ vào vận hành chính thức.'],
    ],
  },
} as const;

export default function LegalPage({ kind }: LegalPageProps) {
  const page = sections[kind];
  const Icon = kind === 'terms' ? Scale : ShieldCheck;

  return <main className="relative min-h-screen overflow-hidden bg-[#eef2f1] px-4 py-7 text-brand-text sm:px-6 sm:py-10">
    <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-[#d7ebe4]/70" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-[#e8e1f2]/65" />
    <article className="relative mx-auto w-full max-w-3xl rounded-2xl border border-[#d6e2dd] bg-[#fffcf8] p-5 shadow-[0_18px_45px_rgba(45,70,62,0.1)] sm:p-9">
      <Link to="/register" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary-light focus-visible:outline-2 focus-visible:outline-brand-primary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Quay lại đăng ký</Link>
      <header className="mt-5 border-b border-brand-border pb-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary-light text-brand-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{page.title}</h1>
        <p className="mt-3 text-sm leading-6 text-brand-text-muted">{page.intro}</p>
        <p className="mt-3 text-xs text-brand-text-muted">Cập nhật: 31/10/2026 · Bản dự thảo</p>
      </header>
      <div className="divide-y divide-brand-border">
        {page.items.map(([heading, body]) => <section key={heading} className="py-5 first:pt-6 last:pb-2"><h2 className="text-base font-bold">{heading}</h2><p className="mt-2 text-sm leading-7 text-[#475750]">{body}</p></section>)}
      </div>
      <aside className="mt-6 rounded-xl border border-[#ead5bd] bg-[#fff6e9] p-4 text-sm leading-6 text-[#624d39]">
        Đây là bản nội dung sản phẩm để Signify rà soát, không phải tư vấn pháp lý. Trước khi công bố, hãy xác nhận đơn vị vận hành, email/địa chỉ liên hệ, dữ liệu thực tế thu thập, nhà cung cấp AI, nơi lưu trữ, thời hạn lưu giữ và quy trình rút lại/xóa dữ liệu.
      </aside>
    </article>
  </main>;
}
