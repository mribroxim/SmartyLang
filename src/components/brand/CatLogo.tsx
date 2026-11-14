/** The SmartyLang logo: Smarty's face (same image as the favicon, public/smarty-face.svg). */
export function CatLogo({ className = '' }: { className?: string }) {
  return <img src="/smarty-face.svg" alt="" aria-hidden draggable={false} className={`select-none object-contain ${className}`} />;
}
