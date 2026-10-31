export function transform(content) {
    let processed = content;

    processed = content.replaceAll("&", "&amp;")
                       .replaceAll("<", "&lt;")
                       .replaceAll(">", "&gt;")
                       .replaceAll("\n", "<br>");

    processed = processed.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

    return processed;
  }