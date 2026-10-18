type SupportEmailInput = {
  subject: string;
  message: string;
  userEmail: string | undefined;
  plan: string;
  priority: string;
  createdAt: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendSupportTicketEmail(ticket: SupportEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const recipients = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!apiKey || !from || recipients.length === 0) {
    throw new Error(
      "Email support belum dikonfigurasi. Isi RESEND_API_KEY, RESEND_FROM_EMAIL, dan ADMIN_EMAILS.",
    );
  }

  const subject = ticket.subject.replace(/[\r\n]+/g, " ").trim();
  const text = [
    "Tiket support baru diterima.",
    "",
    `Dari: ${ticket.userEmail || "(email tidak tersedia)"}`,
    `Paket: ${ticket.plan}`,
    `Prioritas: ${ticket.priority}`,
    `Waktu: ${ticket.createdAt}`,
    `Subjek: ${subject}`,
    "",
    ticket.message,
  ].join("\n");
  const html = `
    <h1>Tiket support baru</h1>
    <p><strong>Dari:</strong> ${escapeHtml(ticket.userEmail || "(email tidak tersedia)")}</p>
    <p><strong>Paket:</strong> ${escapeHtml(ticket.plan)}</p>
    <p><strong>Prioritas:</strong> ${escapeHtml(ticket.priority)}</p>
    <p><strong>Waktu:</strong> ${escapeHtml(ticket.createdAt)}</p>
    <p><strong>Subjek:</strong> ${escapeHtml(subject)}</p>
    <p>${escapeHtml(ticket.message).replace(/\n/g, "<br>")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `[UsahaBit Support] ${subject}`,
      text,
      html,
      ...(ticket.userEmail ? { reply_to: ticket.userEmail } : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Resend returned HTTP ${response.status}.`);
  }
}
