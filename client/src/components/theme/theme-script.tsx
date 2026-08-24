const source = `(function(){try{var p=localStorage.getItem('fileora:theme');if(p!=='light'&&p!=='dark'&&p!=='system')p='system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})();`;

/** Applies the effective saved theme before hydration to avoid a wrong-theme flash. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: source }} />;
}
