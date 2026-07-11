// AIの回答にはMarkdown記法（##見出し、**太字**、- 箇条書き）が含まれることがある。
// 外部ライブラリを追加せず、必要な範囲だけを簡易的にHTML風の見た目に変換する。
// テンプレートリテラル(バッククォート)は使わず、文字列連結(+)だけで書く。
// これは、コピー貼り付け時にバッククォートが崩れる事故を避けるための意図的な選択。

function renderInline(text, keyPrefix) {
  var combinedPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)、。「」]+)/g;
  var segments = [];
  var lastIndex = 0;
  var match;

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

  return segments.map(function (seg, segIndex) {
    if (seg.type === "link") {
      return (
        <a
          key={keyPrefix + "-link-" + segIndex}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="md-link"
        >
          {seg.label}
        </a>
      );
    }
    var parts = seg.value.split(/(\*\*[^*]+\*\*)/g);
    return parts.map(function (part, i) {
      if (part.indexOf("**") === 0 && part.lastIndexOf("**") === part.length - 2 && part.length > 3) {
        return (
          <strong key={keyPrefix + "-" + segIndex + "-" + i}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={keyPrefix + "-" + segIndex + "-" + i}>{part}</span>;
    });
  });
}

export default function MarkdownLite(props) {
  var text = props.text;
  if (!text) return null;
  var lines = text.split("\n");

  var elements = [];
  var listBuffer = [];

  function flushList(key) {
    if (listBuffer.length > 0) {
      elements.push(
        <ul className="md-list" key={"list-" + key}>
          {listBuffer.map(function (item, i) {
            return <li key={i}>{renderInline(item, "li-" + key + "-" + i)}</li>;
          })}
        </ul>
      );
      listBuffer = [];
    }
  }

  lines.forEach(function (line, i) {
    var trimmed = line.trim();

    if (!trimmed) {
      flushList(i);
      return;
    }

    var headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList(i);
      var level = headingMatch[1].length;
      var content = headingMatch[2];
      elements.push(
        <p className={"md-heading md-heading-" + level} key={"h-" + i}>
          {renderInline(content, "h-" + i)}
        </p>
      );
      return;
    }

    var bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      return;
    }

    flushList(i);
    elements.push(<p key={"p-" + i}>{renderInline(trimmed, "p-" + i)}</p>);
  });

  flushList("end");

  return <>{elements}</>;
}
