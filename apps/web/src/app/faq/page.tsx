import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-[#f8f6ef]">
        <section className="border-b border-[#e8ddca] bg-[#f0efe5] py-12 md:py-16">
          <div className="container mx-auto px-4 text-center md:px-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">Help centre</p>
            <h1 className="text-4xl tracking-[-0.035em] md:text-5xl">Frequently asked questions</h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#625f58]">Quick answers about delivery, payment, and order updates.</p>
          </div>
        </section>
        <div className="container mx-auto grid max-w-5xl gap-4 px-4 py-10 md:grid-cols-2 md:px-8 md:py-14">
          {[
            { q: 'How long does delivery take?', a: 'Delivery times vary based on your PIN code. Typically, orders are delivered within 2-5 business days.' },
            { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes, Cash on Delivery is available for most serviceable PIN codes.' },
            { q: 'How can I track my order?', a: 'Once logged in, navigate to My Account → Orders to view the status of your purchases.' },
            { q: 'Can I cancel my order?', a: 'Orders can be cancelled before they are marked as shipped. Please contact our support team as soon as possible.' },
          ].map((item, index) => (
            <details key={item.q} className="group rounded-[1.25rem] border border-[#e4d6bb] bg-[#fbf8f1] p-5 open:bg-white md:p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl text-[#17151a]">
                <span><span className="mr-3 text-sm font-sans text-[#78977d]">0{index + 1}</span>{item.q}</span>
                <span aria-hidden="true" className="text-[#78977d] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 border-t border-[#e8ddca] pt-4 leading-7 text-[#625f58]">{item.a}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
