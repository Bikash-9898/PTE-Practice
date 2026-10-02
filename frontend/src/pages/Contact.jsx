import { useState } from "react";
import { FiMail, FiMapPin, FiMessageSquare } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "../components/common/Button";
import { validateEmail } from "../utils/helpers";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!validateEmail(form.email)) e.email = "Valid email is required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = "Message must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    toast.success("Message saved locally for this demo. No email was sent.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div>
      <section className="bg-navy text-white section-padding py-14">
        <div className="container-main">
          <h1 className="text-4xl font-bold mb-2">Contact us</h1>
          <p className="text-slate-300">Questions about the practice platform? Send us a message.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-main grid lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            {[
              { icon: FiMail, title: "Email", text: "support@ptemaster.demo" },
              { icon: FiMapPin, title: "Location", text: "Online · Available worldwide" },
              {
                icon: FiMessageSquare,
                title: "Demo note",
                text: "This form stores nothing on a server — frontend demo only.",
              },
            ].map((c) => (
              <div key={c.title} className="card p-5 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <c.icon size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-navy dark:text-white">{c.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="lg:col-span-2 card p-6 md:p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="subject">Subject</label>
              <input
                id="subject"
                className="input"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>
            <div>
              <label className="label" htmlFor="message">Message</label>
              <textarea
                id="message"
                rows={5}
                className="input resize-y"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
            </div>
            <Button type="submit" loading={loading}>
              Send Message
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
