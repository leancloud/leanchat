import Markdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
  a: (props) => {
    if (props.href) {
      return <a {...props} target="_blank" rel="noopener noreferrer" />;
    } else {
      return <span {...props} />;
    }
  },
};

export function MdMessage({ children }: { children: string }) {
  return (
    <Markdown
      className="min-w-[16px] markdown-body"
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {children}
    </Markdown>
  );
}
