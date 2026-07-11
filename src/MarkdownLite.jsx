// AIの回答にはMarkdown記法（##見出し、**太字**、- 箇条書き）が含まれることがある。
// 外部ライブラリを追加せず、必要な範囲だけを簡易的にHTML風の見た目に変換する。

function renderInline(text, keyPrefix) {
  // [表示テキスト](URL) と、裸のURL（https://...）の両方をクリック可能なリンクにする。
  // **太字** を <strong> に変換する処理と合わせて、まずリンクで分割してから太字を処理する。
  const combinedPattern =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)、。「」]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ type: "link", label: match[1], url: match[2] });
    } else {
      segments.push({ type: "link", label: match[3], url: match[3] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.map((seg, segIndex) => {
    if (seg.type === "link") {
      return (
        
          key={`${keyPrefix}-link-${segIndex}`}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="md-link"
        >
          {seg.label}
        </a>
      );
    }
    const parts = seg.value.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`${keyPrefix}-${segIndex}-${i}`}>{part.slice(2, -2)}</strong>
        );
      }
      return <span key={`${keyPrefix}-${segIndex}-${i}`}>{part}</span>;
    });
  });
}

export default function MarkdownLite({ text }) {
  if (!text) return null;
  const lines = text.split("\n");

  const elements = [];
  let listBuffer = [];

  function flushList(key) {
    if (listBuffer.length > 0) {
      elements.push(
        <ul className="md-list" key={`list-${key}`}>
          {listBuffer.map((item, i) => (
            <li key={i}>{renderInline(item, `li-${key}-${i}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(i);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList(i);
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      elements.push(
        <p className={`md-heading md-heading-${level}`} key={`h-${i}`}>
          {renderInline(content, `h-${i}`)}
        </p>
      );
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }

    flushList(i);
    elements.push(<p key={`p-${i}`}>{renderInline(trimmed, `p-${i}`)}</p>);
  });

  flushList("end");

  return <>{elements}</>;
}
