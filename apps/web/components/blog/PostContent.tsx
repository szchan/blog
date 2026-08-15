import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import { toHtml } from "hast-util-to-html";
import type { Root } from "mdast";
import type { Root as HastRoot } from "hast";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypePrettyCode, { theme: "github-dark", keepBackground: true });

async function renderMarkdown(content: string): Promise<string> {
  const tree = processor.parse(content) as Root;
  const hast = (await processor.run(tree)) as HastRoot;
  return toHtml(hast);
}

interface PostContentProps {
  content: string;
}

export async function PostContent({ content }: PostContentProps) {
  const html = await renderMarkdown(content);
  return (
    <div
      className="post-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
