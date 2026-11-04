import PostalMime from "postal-mime";

export default {
  async email(message, env, ctx) {
    const subject = message.headers.get("subject") || "";
    const rawEmail = await PostalMime.parse(message.raw);
    const emailBody = rawEmail.text || rawEmail.html || "";

    // First-pass spam and relevance screening
    function screenEmail(subject, emailBody) {
      const subjectText = subject.toLowerCase();
      const bodyText = rawEmail.toLowerCase();

      // Prevent excessively large messages from
      // consuming unnecessary processing resources.
      if (message.rawSize > 1024 * 1024) {
        return {
          status: "REVIEW",
          reason: "Large email"
        };
      }

      const spamPatterns = [
        /\bcasino\b/,
        /\bcrypto investment opportunity\b/,
        /\bguaranteed returns\b/,
        /\bbuy email lists\b/,
        /\bseo backlink packages\b/
      ];

      // Only use the subject for this strict check.
      // Newsletters might mention spam topics in
      // unrelated quoted or forwarded content.
      if (spamPatterns.some(pattern => pattern.test(subjectText))) {
        return {
          status: "SKIP",
          reason: "Spam-like subject"
        };
      }

      const eventPatterns = [
        /\bevent\b/,
        /\bmeetup\b/,
        /\bworkshop\b/,
        /\bconference\b/,
        /\bhackathon\b/,
        /\bwebinar\b/,
        /\bregister\b/,
        /\brsvp\b/,
        /\bjoin us\b/
      ];

      const techPatterns = [
        /\bai\b/,
        /\bartificial intelligence\b/,
        /\btechnology\b/,
        /\bsoftware\b/,
        /\bdeveloper\b/,
        /\bcoding\b/,
        /\bprogramming\b/,
        /\bcybersecurity\b/,
        /\brobotics\b/,
        /\bdata science\b/
      ];

      const combinedText = subjectText + " " + bodyText;

      const hasEventSignal = eventPatterns.some(
        pattern => pattern.test(combinedText)
      );

      const hasTechSignal = techPatterns.some(
        pattern => pattern.test(combinedText)
      );

      if (hasEventSignal && hasTechSignal) {
        return {
          status: "PASS",
          reason: "Tech event signals found"
        };
      }

      return {
        status: "REVIEW",
        reason: "Insufficient information"
      };
    }

    const result = screenEmail(subject, rawEmail);

    console.log("Email screening result:", {
      from: message.from,
      subject,
      status: result.status,
      reason: result.reason
    });

    // Testing only:
    // No forwarding, Gemini calls, or Firestore writes.
  }
};
