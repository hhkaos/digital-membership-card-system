import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

export default function InfoTooltip({ content, children }) {
  return (
    <Tippy
      content={content}
      placement="top"
      touch={['hold', 500]}
      interactive={true}
      maxWidth={300}
    >
      {children || (
        <button
          type="button"
          className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs text-gray-500 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none cursor-help align-middle"
          aria-label="More information"
        >
          i
        </button>
      )}
    </Tippy>
  );
}
