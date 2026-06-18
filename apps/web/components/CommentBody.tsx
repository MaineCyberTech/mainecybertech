import { memo } from "react";

function parseMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class='rounded bg-white/10 px-1 py-0.5 text-xs'>$1</code>");

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  // Numbered lists
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li value="$1">$2</li>');
  html = html.replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, "<ol class='list-decimal list-inside space-y-1'>$1</ol>");

  // Bullet lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul class='list-disc list-inside space-y-1'>$1</ul>");

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
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default memo(CommentBody);
