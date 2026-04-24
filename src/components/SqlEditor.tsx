import CodeMirror from '@uiw/react-codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';

export function SqlEditor({
  value,
  onChange,
  height = '200px',
}: {
  value: string;
  onChange: (v: string) => void;
  height?: string;
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-white/10 bg-black/40">
      <CodeMirror
        value={value}
        height={height}
        theme="dark"
        extensions={[sql({ dialect: SQLite, upperCaseKeywords: true })]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: true,
          foldGutter: false,
        }}
      />
    </div>
  );
}
