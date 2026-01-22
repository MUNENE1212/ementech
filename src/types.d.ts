declare module '*.jsx' {
  import { FunctionComponent, ReactNode } from 'react';
  const component: FunctionComponent<{ children?: ReactNode } & Record<string, unknown>>;
  export default component;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
