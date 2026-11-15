export function transform(content) {
    let processed = content;

    processed = content.replaceAll("&", "&amp;")
                       .replaceAll("<", "&lt;")
                       .replaceAll(">", "&gt;")
                       .replaceAll("\n", "<br>");

    processed = processed.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    processed = processed.replace(/(^|<br>) *&gt; ?(.*?)(?=<br>|$)/g, "$1<span style = \"display: inline-block; border-left: 2px solid; padding-left: 8px;\">$2</span>")

    return processed;
}