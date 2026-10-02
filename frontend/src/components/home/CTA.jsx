import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import Button from "../common/Button";

export default function CTA() {
  return (
    <section className="section-padding">
      <div className="container-main">
        <div className="rounded-3xl bg-navy px-8 py-12 md:px-16 md:py-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to practice smarter?
            </h2>
            <p className="text-slate-300 max-w-xl mx-auto mb-8">
              Create a free demo account and start improving your PTE skills with timed practice and
              mock tests today.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="lg">
                  Get Started Free <FiArrowRight />
                </Button>
              </Link>
              <Link to="/practice">
                <Button
                  size="lg"
                  className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
                >
                  Browse Practice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
