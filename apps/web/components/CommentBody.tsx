import { memo } from "react";

function parseMarkdown(text: string): string {
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    "<code class='rounded bg-white/10 px-1 py-0.5 text-xs'>$1</code>",
  );

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links [text](url) — only http(s) URLs are allowed. Rejecting via a
  // startsWith() prefix check is bypassable (browsers strip ASCII tab/newline
  // inside URLs, so "java\tscript:" would slip through); instead resolve the
  // URL and check its protocol, and HTML-escape it so it cannot break out of
  // the href attribute.
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, rawUrl) => {
    const url = (rawUrl as string).trim();
    // Control chars are stripped by URL parsers and enable scheme obfuscation.
    if (/[\u0000-\u001f\u007f]/.test(url)) return text as string;
    let protocol: string;
    try {
      protocol = new URL(url, "https://mct.invalid").protocol;
    } catch {
      return text as string;
    }
    if (protocol !== "http:" && protocol !== "https:") return text as string;
    const safeUrl = url
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<a href="${safeUrl}" class="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li value="$1">$2</li>');
  html = html.replace(
    /((?:<li[^>]*>.*<\/li>\n?)+)/g,
    "<ol class='list-decimal list-inside space-y-1'>$1</ol>",
  );

  // Bullet lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(
    /((?:<li>.*<\/li>\n?)+)/g,
    "<ul class='list-disc list-inside space-y-1'>$1</ul>",
  );

  // Newlines to <br> for remaining non-HTML newlines
  html = html.replace(/\n(?!<)/g, "<br />");

  return html;
}

type Props = {
  body?: string | null;
  className?: string;
};

function CommentBody({ body, className }: Props) {
  if (!body) return null;
  const html = parseMarkdown(body);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default memo(CommentBody);
