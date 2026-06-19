/**
 * 简单稳健的分块：按段落聚合到目标长度，保留语义边界。
 * 目标 ~500 字符/块，过长的段落按句子再切。
 */
const TARGET = 500;
const MAX = 800;

export interface Chunk {
  index: number;
  content: string;
}

export function chunkText(raw: string): Chunk[] {
  const paragraphs = raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  let buf = "";

  const flush = () => {
    const t = buf.trim();
    if (t) pieces.push(t);
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length > MAX) {
      flush();
      // 超长段落按句号/分号切
      const sentences = p.split(/(?<=[。；;!?])/);
      let s = "";
      for (const sent of sentences) {
        if ((s + sent).length > TARGET) {
          if (s) pieces.push(s.trim());
          s = sent;
        } else {
          s += sent;
        }
      }
      if (s.trim()) pieces.push(s.trim());
      continue;
    }
    if ((buf + "\n\n" + p).length > TARGET && buf) flush();
    buf = buf ? `${buf}\n\n${p}` : p;
  }
  flush();

  return pieces.map((content, index) => ({ index, content }));
}
